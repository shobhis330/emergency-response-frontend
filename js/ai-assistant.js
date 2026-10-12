/* =========================================================
   SmartEMS AI Emergency Assistant
   Voice + Natural Language + Follow-up Questions
   ========================================================= */

(function () {
    "use strict";

    console.log("SmartEMS AI Assistant: loading...");

    /* =========================================================
       1. STATE
       ========================================================= */

    const state = {
        active: false,
        emergencyType: "",
        questionIndex: 0,
        answers: {},
        transcript: [],
        recognition: null,
        listening: false,
        initialFeatures: {},
        knownFeatures: new Set(),
        initialStatement: ""
    };

    /* =========================================================
       2. ML FEATURES
       IMPORTANT:
       Verify default values against your trained model before
       using the output for real triage.
       ========================================================= */

    const DEFAULT_FEATURES = {
        age: 30,
        emergency_type: "General Emergency",
        incident_location: "Unknown",

        bleeding: "No",
        conscious: "Yes",
        breathing: "Normal",

        accident_level: "None",
        visible_fracture: "No",
        trapped: "No",
        injury_type: "None",

        pain_level: "Mild",

        chest_pain: "No",
        sweating: "No",
        shortness_of_breath: "No",

        face_drooping: "No",
        arm_weakness: "No",
        speech_difficulty: "No",

        poison_type: "None",
        vomiting: "No",
        seizures: "No",

        entry_exit_burn: "No",
        muscle_spasm: "No",
        fall_after_shock: "No",

        water_type: "None",
        water_inhalation: "No",
        cpr_required: "No",

        fall_height: 0,
        head_injury: "No",

        animal_type: "None",
        bite_location: "None",
        venomous: "No",

        weapon_involved: "No",
        injury_location: "None",
        visible_injury: "No"
    };

    /* =========================================================
       3. EXTRACT FACTS FROM THE INITIAL DESCRIPTION
       ========================================================= */

    function extractInitialFacts(
        statement,
        ageValue,
        emergencyType
    ) {
        const text = String(statement || "")
            .toLowerCase()
            .replace(/[^a-z0-9.\s'-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const features = {};
        const knownFeatures = new Set();

        const matches = (patterns) =>
            patterns.some((pattern) => pattern.test(text));

        function setYesNo(
            feature,
            positivePatterns,
            negativePatterns
        ) {
            const positive = matches(positivePatterns);
            const negative = matches(negativePatterns);

            // Conflicting or unclear information stays unknown.
            if (positive === negative) return;

            features[feature] = positive ? "Yes" : "No";
            knownFeatures.add(feature);
        }

        // Read age from the existing emergency form.
        const ageMatch = String(ageValue || "")
            .trim()
            .match(/^\d{1,3}$/);

        if (ageMatch) {
            const age = Number(ageMatch[0]);

            if (age >= 1 && age <= 120) {
                features.age = age;
                knownFeatures.add("age");
            }
        }

        if (emergencyType) {
            features.emergency_type = emergencyType;
        }

        // Bleeding
        setYesNo(
            "bleeding",
            [
                /\b(heavy bleeding|bleeding|bleed|blood loss|blood is coming)\b/
            ],
            [
                /\b(no bleeding|not bleeding|without bleeding|no blood loss|isn't bleeding)\b/
            ]
        );

        // Consciousness
        if (
            matches([
                /\b(unconscious|passed out|unresponsive|not responding|lost consciousness|not conscious)\b/
            ]) &&
            !matches([
                /\b(not unconscious|not passed out|not unresponsive)\b/
            ])
        ) {
            features.conscious = "No";
            knownFeatures.add("conscious");
        } else if (
            matches([
                /\b(fully conscious|awake and alert|patient is awake|patient is conscious|alert and responsive)\b/
            ])
        ) {
            features.conscious = "Yes";
            knownFeatures.add("conscious");
        }

        // Breathing
        if (
            matches([
                /\b(not breathing|cannot breathe|can't breathe|difficulty breathing|difficulty in breathing|shortness of breath|breathless|breathing problem|struggling to breathe)\b/
            ]) &&
            !matches([
                /\b(no difficulty breathing|no shortness of breath|breathing without difficulty)\b/
            ])
        ) {
            features.breathing = "Difficulty";
            features.shortness_of_breath = "Yes";

            knownFeatures.add("breathing");
            knownFeatures.add("shortness_of_breath");
        } else if (
            matches([
                /\b(breathing normally|normal breathing|breathing fine|no breathing problem|no difficulty breathing|no shortness of breath)\b/
            ])
        ) {
            features.breathing = "Normal";
            features.shortness_of_breath = "No";

            knownFeatures.add("breathing");
            knownFeatures.add("shortness_of_breath");
        }

        // Chest pain
        setYesNo(
            "chest_pain",
            [
                /\b(chest pain|pain in (the )?chest|chest tightness|chest pressure|chest hurts|chest discomfort)\b/
            ],
            [
                /\b(no chest pain|no pain in (the )?chest|no chest tightness|no chest pressure)\b/
            ]
        );

        // Sweating
        setYesNo(
            "sweating",
            [
                /\b(cold sweat|excessive sweating|sweating heavily|sweaty|profuse sweating)\b/
            ],
            [
                /\b(no sweating|not sweating|no cold sweat)\b/
            ]
        );

        // Stroke-related symptoms
        setYesNo(
            "face_drooping",
            [
                /\b(face drooping|drooping face|facial droop|face is drooping)\b/
            ],
            [
                /\b(no face drooping|no facial droop|face is not drooping)\b/
            ]
        );

        setYesNo(
            "arm_weakness",
            [
                /\b(arm weakness|weak arm|arm is weak|weakness in (the )?arm|cannot move (the )?arm|can't move (the )?arm)\b/
            ],
            [
                /\b(no arm weakness|arms are not weak|no weakness in (the )?arm)\b/
            ]
        );

        setYesNo(
            "speech_difficulty",
            [
                /\b(slurred speech|difficulty speaking|cannot speak|can't speak|unable to speak|speech difficulty)\b/
            ],
            [
                /\b(no speech difficulty|speaking normally|speech is normal)\b/
            ]
        );

        // Vomiting
        setYesNo(
            "vomiting",
            [
                /\b(vomiting|vomit|throwing up)\b/
            ],
            [
                /\b(no vomiting|not vomiting|no vomit|has not vomited)\b/
            ]
        );

        // Seizures
        setYesNo(
            "seizures",
            [
                /\b(seizure|seizures|convulsion|convulsions|having a fit|fits)\b/
            ],
            [
                /\b(no seizure|no seizures|no convulsions|not having a fit)\b/
            ]
        );

        // Fractures
        setYesNo(
            "visible_fracture",
            [
                /\b(fracture|broken bone|broken arm|broken leg|bone is broken)\b/
            ],
            [
                /\b(no fracture|no broken bone|no broken arm|no broken leg)\b/
            ]
        );

        // Trapped after an accident
        setYesNo(
            "trapped",
            [
                /\b(trapped|stuck and cannot get out|can't get out|pinned under)\b/
            ],
            [
                /\b(not trapped|not stuck|not pinned)\b/
            ]
        );

        // Head injury
        setYesNo(
            "head_injury",
            [
                /\b(head injury|hit my head|hit his head|hit her head|head trauma|head wound|injured my head)\b/
            ],
            [
                /\b(no head injury|did not hit my head|did not hit his head|did not hit her head|no head trauma)\b/
            ]
        );

        // Visible injuries
        setYesNo(
            "visible_injury",
            [
                /\b(open wound|visible wound|deep cut|open cut|visible injury|blood coming from wound|large wound)\b/
            ],
            [
                /\b(no visible injury|no visible injuries|no wound|no wounds|no injuries|no injury|without injury)\b/
            ]
        );

        // Water inhalation
        setYesNo(
            "water_inhalation",
            [
                /\b(inhaled water|water in lungs|breathed in water|water inhalation)\b/
            ],
            [
                /\b(no water inhalation|did not inhale water|didn't inhale water)\b/
            ]
        );

        // CPR
        setYesNo(
            "cpr_required",
            [
                /\b(cpr is being performed|needs cpr|cpr required|cardiac arrest|heart has stopped)\b/
            ],
            [
                /\b(no cpr|cpr not required|does not need cpr)\b/
            ]
        );

        // Burns
        setYesNo(
            "entry_exit_burn",
            [
                /\b(burn|burned|burnt|burn injury|electric burn)\b/
            ],
            [
                /\b(no burn|not burned|not burnt|no burn injury)\b/
            ]
        );

        // Muscle spasms
        setYesNo(
            "muscle_spasm",
            [
                /\b(muscle spasm|muscle spasms|muscle cramp|muscle cramps)\b/
            ],
            [
                /\b(no muscle spasm|no muscle cramps|no muscle cramp)\b/
            ]
        );

        // Weapon involvement
        setYesNo(
            "weapon_involved",
            [
                /\b(gunshot|gun|knife|weapon|stabbed|stabbing|bullet wound)\b/
            ],
            [
                /\b(no weapon|no gun|no knife|weapon not involved)\b/
            ]
        );

        // Pain level
        if (matches([/\b(severe|extreme|unbearable|excruciating) pain\b/])) {
            features.pain_level = "Severe";
            knownFeatures.add("pain_level");
        } else if (matches([/\b(moderate|medium) pain\b/])) {
            features.pain_level = "Moderate";
            knownFeatures.add("pain_level");
        } else if (matches([/\b(mild|slight|minor|little) pain\b/])) {
            features.pain_level = "Mild";
            knownFeatures.add("pain_level");
        } else if (
            matches([
                /\b(no pain|without pain|does not hurt|doesn't hurt)\b/
            ])
        ) {
            features.pain_level = "None";
            knownFeatures.add("pain_level");
        }

        // Fall height
        const heightMatch = text.match(
            /\b(\d+(?:\.\d+)?)\s*(feet|foot|ft|meters|meter|m)\b/
        );

        if (
            heightMatch &&
            matches([/\b(fall|fell|fallen|slipped|tripped)\b/])
        ) {
            let height = Number(heightMatch[1]);

            if (/^(meters|meter|m)$/.test(heightMatch[2])) {
                height *= 3.28084;
            }

            features.fall_height = Math.round(height);
            knownFeatures.add("fall_height");
        }

        // More emergency-specific extraction continues in Part 2.

        return {
            features,
            knownFeatures
        };
    }

    // Part 2 continues below this line.
        /* =========================================================
       PART 2: EMERGENCY-SPECIFIC QUESTIONS
       ========================================================= */

    const QUESTION_SETS = {
        "Accident": [
            {
                feature: "bleeding",
                question: "Is the patient bleeding?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "accident_level",
                question: "How serious does the accident appear: Minor, Moderate, or Severe?"
            },
            {
                feature: "visible_fracture",
                question: "Is there a visible fracture or suspected broken bone?"
            },
            {
                feature: "trapped",
                question: "Is the patient trapped inside a vehicle or under something?"
            },
            {
                feature: "injury_type",
                question: "What type of injury is present?"
            },
            {
                feature: "pain_level",
                question: "How severe is the patient's pain: None, Mild, Moderate, or Severe?"
            },
            {
                feature: "head_injury",
                question: "Does the patient have a head injury?"
            },
            {
                feature: "visible_injury",
                question: "Are there any visible injuries?"
            },
            {
                feature: "injury_location",
                question: "Where on the body is the injury?"
            }
        ],

        "Chest Pain": [
            {
                feature: "chest_pain",
                question: "Is the patient experiencing chest pain or pressure?"
            },
            {
                feature: "sweating",
                question: "Is the patient sweating unusually or experiencing cold sweats?"
            },
            {
                feature: "shortness_of_breath",
                question: "Is the patient experiencing shortness of breath?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: Mild, Moderate, or Severe?"
            }
        ],

        "Breathing Problem": [
            {
                feature: "breathing",
                question: "Is the patient breathing normally, struggling to breathe, or not breathing?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "chest_pain",
                question: "Is the patient also experiencing chest pain?"
            },
            {
                feature: "sweating",
                question: "Is the patient sweating unusually?"
            }
        ],

        "Stroke": [
            {
                feature: "face_drooping",
                question: "Is one side of the patient's face drooping?"
            },
            {
                feature: "arm_weakness",
                question: "Does the patient have weakness in one arm?"
            },
            {
                feature: "speech_difficulty",
                question: "Is the patient having difficulty speaking or speaking unclearly?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],

        "Burn": [
            {
                feature: "entry_exit_burn",
                question: "Does the patient have a burn injury?"
            },
            {
                feature: "injury_location",
                question: "Where is the burn located?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: Mild, Moderate, or Severe?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            }
        ],

        "Poisoning": [
            {
                feature: "poison_type",
                question: "What substance may have caused the poisoning, if known?"
            },
            {
                feature: "vomiting",
                question: "Is the patient vomiting?"
            },
            {
                feature: "seizures",
                question: "Is the patient experiencing seizures?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            }
        ],

        "Drowning": [
            {
                feature: "water_type",
                question: "Where did the incident happen: pool, river, sea, or another water source?"
            },
            {
                feature: "water_inhalation",
                question: "Did the patient inhale or swallow water?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "cpr_required",
                question: "Is CPR currently being performed or has a qualified responder indicated it is needed?"
            }
        ],

        "Animal Bite": [
            {
                feature: "animal_type",
                question: "What animal caused the bite?"
            },
            {
                feature: "bite_location",
                question: "Where on the body is the bite?"
            },
            {
                feature: "venomous",
                question: "Is the animal known or suspected to be venomous?"
            },
            {
                feature: "bleeding",
                question: "Is the bite bleeding?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: Mild, Moderate, or Severe?"
            }
        ],

        "Fall": [
            {
                feature: "fall_height",
                question: "Approximately how high did the patient fall? Enter the height in feet, or enter 0 if unknown."
            },
            {
                feature: "head_injury",
                question: "Did the patient hit their head or sustain a head injury?"
            },
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "bleeding",
                question: "Is the patient bleeding?"
            },
            {
                feature: "visible_fracture",
                question: "Is there a visible fracture or suspected broken bone?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: Mild, Moderate, or Severe?"
            }
        ],

        "General Emergency": [
            {
                feature: "conscious",
                question: "Is the patient conscious and responding?"
            },
            {
                feature: "breathing",
                question: "Is the patient breathing normally?"
            },
            {
                feature: "bleeding",
                question: "Is the patient bleeding?"
            },
            {
                feature: "pain_level",
                question: "How severe is the pain: None, Mild, Moderate, or Severe?"
            },
            {
                feature: "visible_injury",
                question: "Are there any visible injuries?"
            }
        ]
    };

    /* =========================================================
       PART 2 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 3: ANSWER NORMALIZATION
       Converts user answers into consistent feature values.
       ========================================================= */

    function normalizeAnswer(feature, rawAnswer) {
        const answer = String(rawAnswer || "")
            .trim()
            .toLowerCase();

        if (!answer) return "";

        const yesAnswers = [
            "yes", "yeah", "yep", "true", "present",
            "there is", "they are", "he is", "she is"
        ];

        const noAnswers = [
            "no", "nope", "false", "absent",
            "there isn't", "there is not",
            "they are not", "he is not", "she is not"
        ];

        const isYes = yesAnswers.includes(answer);
        const isNo = noAnswers.includes(answer);

        const yesNoFeatures = [
            "bleeding",
            "conscious",
            "visible_fracture",
            "trapped",
            "chest_pain",
            "sweating",
            "shortness_of_breath",
            "face_drooping",
            "arm_weakness",
            "speech_difficulty",
            "vomiting",
            "seizures",
            "entry_exit_burn",
            "muscle_spasm",
            "fall_after_shock",
            "water_inhalation",
            "cpr_required",
            "head_injury",
            "venomous",
            "weapon_involved",
            "visible_injury"
        ];

        if (yesNoFeatures.includes(feature)) {
            if (isYes) return "Yes";
            if (isNo) return "No";
            return rawAnswer.trim();
        }

        switch (feature) {
            case "age": {
                const age = Number(answer);
                return Number.isInteger(age) && age >= 1 && age <= 120
                    ? age
                    : "";
            }

            case "fall_height": {
                const height = Number(answer);
                return Number.isFinite(height) && height >= 0
                    ? height
                    : "";
            }

            case "breathing":
                if (
                    answer.includes("not breathing") ||
                    answer.includes("no breathing")
                ) {
                    return "Not Breathing";
                }

                if (
                    answer.includes("difficulty") ||
                    answer.includes("struggling") ||
                    answer.includes("shortness") ||
                    answer.includes("breathless") ||
                    answer.includes("hard to breathe")
                ) {
                    return "Difficulty";
                }

                if (
                    answer.includes("normal") ||
                    answer.includes("fine") ||
                    answer.includes("normally") ||
                    answer.includes("okay") ||
                    answer.includes("ok")
                ) {
                    return "Normal";
                }

                return rawAnswer.trim();

            case "pain_level":
                if (
                    answer.includes("severe") ||
                    answer.includes("extreme") ||
                    answer.includes("unbearable")
                ) {
                    return "Severe";
                }

                if (
                    answer.includes("moderate") ||
                    answer.includes("medium")
                ) {
                    return "Moderate";
                }

                if (
                    answer.includes("mild") ||
                    answer.includes("slight") ||
                    answer.includes("little")
                ) {
                    return "Mild";
                }

                if (
                    answer === "none" ||
                    answer === "no pain"
                ) {
                    return "None";
                }

                return rawAnswer.trim();

            case "accident_level":
                if (answer.includes("severe") || answer.includes("major")) {
                    return "Severe";
                }

                if (answer.includes("moderate") || answer.includes("medium")) {
                    return "Moderate";
                }

                if (answer.includes("minor") || answer.includes("mild")) {
                    return "Minor";
                }

                return rawAnswer.trim();

            case "injury_type":
            case "poison_type":
            case "water_type":
            case "animal_type":
            case "bite_location":
            case "injury_location":
                return rawAnswer.trim();

            default:
                return rawAnswer.trim();
        }
    }

    /* =========================================================
       PART 3 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 4: CONVERSATION AND QUESTION FLOW
       ========================================================= */

    function getElement(id) {
        return document.getElementById(id);
    }

    function addMessage(message, sender = "bot") {
        const conversation = getElement("aiConversation");

        if (!conversation) {
            console.warn("AI conversation container not found.");
            return;
        }

        const bubble = document.createElement("div");
        bubble.className = `ai-message ai-${sender}`;
        bubble.textContent = message;

        conversation.appendChild(bubble);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function showQuestion() {
        const questions =
            QUESTION_SETS[state.emergencyType] ||
            QUESTION_SETS["General Emergency"];

        // Skip questions for facts that were already extracted.
        while (state.questionIndex < questions.length) {
            const current = questions[state.questionIndex];

            if (!state.knownFeatures.has(current.feature)) {
                break;
            }

            state.questionIndex++;
        }

        if (state.questionIndex >= questions.length) {
            finishAssistant();
            return;
        }

        const current = questions[state.questionIndex];

        const questionElement = getElement("aiQuestion");
        const input = getElement("aiAnswerInput");
        const inputRow = getElement("aiInputRow");
        const progress = getElement("aiProgressBar");
        const status = getElement("aiStatus");

        if (questionElement) {
            questionElement.textContent = current.question;
            questionElement.hidden = false;
        }

        if (inputRow) {
            inputRow.hidden = false;
        }

        if (input) {
            input.value = "";
            input.placeholder = "Type your answer...";
            input.focus();
        }

        if (progress) {
            progress.style.width =
                `${Math.round(
                    (state.questionIndex / questions.length) * 100
                )}%`;
        }

        if (status) {
            status.textContent =
                `Question ${state.questionIndex + 1} of ${questions.length}`;
        }
    }

    function startAssistant() {
        state.active = true;
        state.questionIndex = 0;
        state.answers = {};
        state.transcript = [];
        state.initialFeatures = {};
        state.knownFeatures = new Set();
        state.initialStatement = "";

        const emergencySelect = getElement("emergencyType");

        state.emergencyType =
            emergencySelect?.value || "General Emergency";

        if (!QUESTION_SETS[state.emergencyType]) {
            state.emergencyType = "General Emergency";
        }

        const statementInput = getElement("symptoms");
        const ageInput = getElement("patientAge");

        state.initialStatement =
            statementInput?.value?.trim() || "";

        const extracted = extractInitialFacts(
            state.initialStatement,
            ageInput?.value,
            state.emergencyType
        );

        state.initialFeatures = { ...extracted.features };
        state.knownFeatures = new Set(extracted.knownFeatures);
        state.answers = { ...extracted.features };

        const conversation = getElement("aiConversation");

        if (conversation) {
            conversation.replaceChildren();
        }

        const progressContainer = getElement("aiProgress");
        if (progressContainer) {
            progressContainer.hidden = false;
        }

        if (conversation) {
            conversation.hidden = false;
        }

        const startButton = getElement("aiStartButton");
        if (startButton) {
            startButton.hidden = true;
        }

        addMessage("Hello! I am the SmartEMS AI emergency assistant.");
        addMessage(
            `I will collect information about this ${state.emergencyType} emergency.`
        );

        if (state.initialStatement) {
            addMessage(
                "I will use the description you provided and ask follow-up questions."
            );
        }

        showQuestion();
    }

    function submitAnswer() {
        if (!state.active) {
            return;
        }

        const input = getElement("aiAnswerInput");

        if (!input) {
            return;
        }

        const rawAnswer = input.value.trim();

        if (!rawAnswer) {
            input.focus();
            return;
        }

        const questions =
            QUESTION_SETS[state.emergencyType] ||
            QUESTION_SETS["General Emergency"];

        const current = questions[state.questionIndex];

        if (!current) {
            finishAssistant();
            return;
        }

        const normalized = normalizeAnswer(
            current.feature,
            rawAnswer
        );

        if (normalized === "" || normalized === undefined) {
            addMessage(
                "I could not understand that answer. Please try again."
            );
            input.focus();
            return;
        }

        state.answers[current.feature] = normalized;
        state.knownFeatures.add(current.feature);

        state.transcript.push({
            question: current.question,
            answer: rawAnswer,
            feature: current.feature,
            value: normalized
        });

        addMessage(rawAnswer, "user");

        state.questionIndex++;
        showQuestion();
    }

    /* =========================================================
       PART 4 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 5: FINISH ASSISTANT
       ========================================================= */

    function finishAssistant() {
        state.active = false;

        const features = {
            ...DEFAULT_FEATURES,
            ...state.initialFeatures,
            ...state.answers
        };

        features.emergency_type =
            state.emergencyType || "General Emergency";

        const ageInput = getElement("patientAge");

        if (ageInput && ageInput.value.trim()) {
            const age = Number(ageInput.value);

            if (Number.isInteger(age) && age >= 1 && age <= 120) {
                features.age = age;
            }
        }

        /*
         * Keep the collected features available to the existing
         * SmartEMS frontend script.
         */
        window.smartEMSFeatures = features;

        window.smartEMSAIData = {
            emergencyType: state.emergencyType,
            initialStatement: state.initialStatement,
            knownFeatures: Array.from(state.knownFeatures),
            answers: { ...state.answers },
            features: { ...features },
            transcript: [...state.transcript]
        };

        /*
         * Update the normal emergency form without replacing
         * the patient's name, phone number, or location.
         */
        const emergencySelect = getElement("emergencyType");

        if (emergencySelect && state.emergencyType) {
            emergencySelect.value = state.emergencyType;
        }

        const progress = getElement("aiProgressBar");

        if (progress) {
            progress.style.width = "100%";
        }

        const question = getElement("aiQuestion");

        if (question) {
            question.hidden = true;
        }

        const inputRow = getElement("aiInputRow");

        if (inputRow) {
            inputRow.hidden = true;
        }

        const status = getElement("aiStatus");

        if (status) {
            status.textContent = "Information collection complete";
        }

        addMessage(
            "The question sequence is complete. Please review the emergency details and use the SOS button to continue."
        );

        console.log(
            "SmartEMS assistant collected features:",
            window.smartEMSFeatures
        );
    }

    /* =========================================================
       PART 5 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 6: VOICE INPUT
       Uses the browser's Web Speech API when available.
       ========================================================= */

    function startVoiceInput() {
        if (!state.active) {
            addMessage("Please start the assistant before using voice input.");
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            addMessage(
                "Voice input is not supported in this browser. Please type your answer instead."
            );
            return;
        }

        // Stop any previous recognition session.
        if (state.recognition) {
            try {
                state.recognition.abort();
            } catch (error) {
                console.warn("Could not stop previous recognition.", error);
            }
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        state.recognition = recognition;
        state.listening = true;

        const voiceButton = getElement("aiVoiceButton");

        if (voiceButton) {
            voiceButton.disabled = true;
            voiceButton.textContent = "Listening...";
        }

        addMessage("Listening. Please speak your answer.");

        recognition.onresult = function (event) {
            const transcript =
                event.results?.[0]?.[0]?.transcript || "";

            const input = getElement("aiAnswerInput");

            if (input && transcript) {
                input.value = transcript;
                input.focus();
            }
        };

        recognition.onerror = function (event) {
            console.warn("Voice recognition error:", event.error);

            if (event.error === "not-allowed") {
                addMessage(
                    "Microphone permission was denied. Allow microphone access or type your answer."
                );
            } else if (event.error !== "aborted") {
                addMessage(
                    "Voice recognition could not complete. Please type your answer instead."
                );
            }
        };

        recognition.onend = function () {
            state.listening = false;

            if (voiceButton) {
                voiceButton.disabled = false;
                voiceButton.textContent = "🎤 Speak";
            }
        };

        try {
            recognition.start();
        } catch (error) {
            state.listening = false;

            if (voiceButton) {
                voiceButton.disabled = false;
                voiceButton.textContent = "🎤 Speak";
            }

            console.error("Unable to start voice recognition:", error);

            addMessage(
                "Unable to start voice input. Please type your answer instead."
            );
        }
    }

    /* =========================================================
       PART 6 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 7: CREATE THE ASSISTANT UI
       ========================================================= */

    function createAssistantUI() {
        if (getElement("aiAssistantCard")) {
            return;
        }

        const sosButton = getElement("sosButton");

        if (!sosButton) {
            console.error(
                "SmartEMS assistant: SOS button was not found."
            );
            return;
        }

        const card = document.createElement("section");
        card.id = "aiAssistantCard";
        card.className = "ai-assistant-card";

        card.innerHTML = `
            <div class="ai-assistant-header">
                <div>
                    <h2>AI Emergency Assistant</h2>
                    <p>
                        Describe the emergency and answer the
                        follow-up questions.
                    </p>
                </div>
                <span aria-hidden="true">🤖</span>
            </div>

            <div class="ai-progress" id="aiProgress" hidden>
                <div class="ai-progress-track">
                    <div
                        class="ai-progress-bar"
                        id="aiProgressBar"
                        style="width: 0%">
                    </div>
                </div>
                <p id="aiStatus" aria-live="polite">
                    Ready to begin
                </p>
            </div>

            <div
                id="aiConversation"
                class="ai-conversation"
                aria-live="polite"
                hidden>
            </div>

            <div
                id="aiQuestion"
                class="ai-question"
                hidden>
            </div>

            <div
                id="aiInputRow"
                class="ai-input-row"
                hidden>

                <input
                    type="text"
                    id="aiAnswerInput"
                    placeholder="Type your answer..."
                    autocomplete="off"
                    aria-label="Your answer">

                <button
                    type="button"
                    id="aiSubmitButton">
                    Send
                </button>

                <button
                    type="button"
                    id="aiVoiceButton">
                    🎤 Speak
                </button>
            </div>

            <button
                type="button"
                id="aiStartButton"
                class="ai-start-button">
                Start AI Assistant
            </button>

            <p class="ai-disclaimer">
                This assistant is an academic prototype. In a real
                emergency, contact emergency services immediately.
                Do not wait for this questionnaire to finish.
            </p>
        `;

        // Insert the assistant immediately before the SOS button.
        sosButton.parentNode.insertBefore(card, sosButton);

        // Start button
        getElement("aiStartButton").addEventListener(
            "click",
            startAssistant
        );

        // Submit by clicking Send
        getElement("aiSubmitButton").addEventListener(
            "click",
            submitAnswer
        );

        // Submit by pressing Enter
        getElement("aiAnswerInput").addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    submitAnswer();
                }
            }
        );

        // Voice input
        getElement("aiVoiceButton").addEventListener(
            "click",
            startVoiceInput
        );
    }

    /* =========================================================
       PART 7 COMPLETE
       ========================================================= */
           /* =========================================================
       PART 8: INITIALIZE THE AI ASSISTANT
       ========================================================= */

    function initialize() {
        createAssistantUI();

        console.log("SmartEMS AI Assistant: initialized.");

        // Check whether the main assistant controls were created.
        if (
            getElement("aiStartButton") &&
            getElement("aiConversation") &&
            getElement("aiAnswerInput")
        ) {
            console.log("SmartEMS AI Assistant: UI ready.");
        } else {
            console.error(
                "SmartEMS AI Assistant: some UI elements are missing."
            );
        }
    }

    /*
     * Expose assistant methods for integration with the
     * existing SmartEMS frontend.
     */
    window.smartEMSAI = {
        start: startAssistant,
        submit: submitAnswer,
        startVoice: startVoiceInput,

        getFeatures: function () {
            return window.smartEMSFeatures
                ? { ...window.smartEMSFeatures }
                : null;
        },

        getState: function () {
            return {
                active: state.active,
                emergencyType: state.emergencyType,
                questionIndex: state.questionIndex,
                transcript: [...state.transcript]
            };
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();