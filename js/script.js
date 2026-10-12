
console.log("SmartEMS initialized");


// ============================================================
// SMARTEMS CONFIGURATION
// ============================================================

const API_BASE =
    "https://meddispatch-backend.onrender.com";

const JSON_HEADERS = {
    "Content-Type": "application/json"
};


// ============================================================
// TEXT HELPERS
// ============================================================

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:()[\]{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


function containsAny(text, phrases) {

    return phrases.some(function (phrase) {
        return text.includes(phrase);
    });

}


function isNegated(text, words) {

    const negations = [
        "no",
        "not",
        "without",
        "never",
        "don't",
        "doesn't",
        "didn't",
        "isn't",
        "wasn't",
        "aren't",
        "cannot",
        "can't"
    ];


    for (const word of words) {

        let startIndex = 0;

        while (true) {

            const index =
                text.indexOf(word, startIndex);

            if (index === -1) {
                break;
            }

            const before =
                text.substring(
                    Math.max(0, index - 40),
                    index
                );


            for (const negation of negations) {

                if (before.includes(negation)) {
                    return true;
                }

            }

            startIndex =
                index + word.length;

        }

    }

    return false;

}


// ============================================================
// 34 ML FEATURE EXTRACTION
// ============================================================

// ============================================================
// 34 ML FEATURE EXTRACTION
// ============================================================

function extractMLFeatures(emergencyType, symptoms, age) {
    const type = normalizeText(emergencyType);
    const symptomText = normalizeText(symptoms);
    const text = `${type} ${symptomText}`;

    console.log("========================================");
    console.log("SMARTEMS FEATURE EXTRACTION");
    console.log("Emergency Type:", emergencyType);
    console.log("User Sentence:", symptoms);
    console.log("Normalized:", text);

    // Defaults retained for compatibility with your existing API.
    const features = {
        age: Number(age) || 0,
        emergency_type: emergencyType || "Unknown",
        incident_location: "",
        bleeding: "No",
        conscious: "Yes",
        breathing: "Normal",
        accident_level: "None",
        visible_fracture: "No",
        trapped: "No",
        injury_type: "Unknown",
        pain_level: "Unknown",
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

    // --------------------------------------------------------
    // SEVERITY WORDS
    // --------------------------------------------------------

    const notSerious = containsAny(text, [
        "not serious",
        "nothing serious",
        "not severe",
        "nothing severe",
        "not badly injured",
        "not badly hurt",
        "only mild",
        "just mild",
        "minor injury",
        "small injury",
        "slight injury",
        "little pain",
        "mild pain",
        "minor pain",
        "slight pain",
        "only a scratch",
        "just a scratch",
        "small scratch",
        "minor accident",
        "minor fall"
    ]);

    const serious = containsAny(text, [
        "very serious",
        "extremely serious",
        "severe injury",
        "severe pain",
        "critical condition",
        "heavy bleeding",
        "heavily bleeding",
        "unconscious",
        "cannot breathe",
        "can't breathe",
        "not breathing",
        "major injury",
        "badly injured",
        "serious injury",
        "major accident",
        "severe accident"
    ]);

    // --------------------------------------------------------
    // FALL AND FALL HEIGHT
    // --------------------------------------------------------

    const fallDetected =
        type.includes("fall") ||
        containsAny(text, [
            "fall",
            "fell",
            "fallen",
            "falling",
            "slipped",
            "slip",
            "tripped",
            "trip",
            "fell down",
            "slipped down",
            "fell from stairs",
            "fell off"
        ]);

    if (fallDetected) {
        features.injury_type = "Fall";

        const heightMatch = text.match(
            /(\d+(?:\.\d+)?)\s*(feet|foot|ft|meter|meters|m)\b/
        );

        if (heightMatch) {
            let height = Number(heightMatch[1]);
            const unit = heightMatch[2];

            if (["meter", "meters", "m"].includes(unit)) {
                height *= 3.28084;
            }

            features.fall_height = Math.round(height);
        }

        if (
            serious ||
            features.fall_height >= 10 ||
            text.includes("head injury") ||
            text.includes("fracture") ||
            text.includes("broken bone") ||
            text.includes("unconscious")
        ) {
            features.accident_level = "Severe";
        } else if (notSerious) {
            features.accident_level = "Minor";

        } else {
            features.accident_level = "Moderate";
        }
    }

    // --------------------------------------------------------
    // BLEEDING
    // --------------------------------------------------------

    const bleedingWords = [
        "bleeding",
        "bleed",
        "blood loss",
        "blood is coming"
    ];

    if (
        containsAny(text, bleedingWords) &&
        !containsAny(text, [
            "no bleeding",
            "not bleeding",
            "without bleeding",
            "no blood loss"
        ]) &&
        !isNegated(text, bleedingWords)
    ) {
        features.bleeding = "Yes";
    }

    if (
        containsAny(text, [
            "no bleeding",
            "not bleeding",
            "without bleeding",
            "no blood loss"
        ])
    ) {
        features.bleeding = "No";
    }

    // --------------------------------------------------------
    // CONSCIOUSNESS
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "unconscious",
            "passed out",
            "lost consciousness",
            "not conscious",
            "not responding",
            "unresponsive"
        ])
    ) {
        features.conscious = "No";
    } else if (
        containsAny(text, [
            "fully conscious",
            "conscious and alert",
            "awake and alert",
            "patient is awake",
            "patient is conscious",
            "responsive and alert"
        ])
    ) {
        features.conscious = "Yes";
    }

    // --------------------------------------------------------
    // BREATHING
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "difficulty breathing",
            "difficulty in breathing",
            "shortness of breath",
            "breathless",
            "cannot breathe",
            "can't breathe",
            "not breathing",
            "breathing problem",
            "breathing difficulty",
            "struggling to breathe"
        ])
    ) {
        features.breathing = "Difficulty";
        features.shortness_of_breath = "Yes";
    } else if (
        containsAny(text, [
            "breathing normally",
            "breathing normal",
            "breathing fine",
            "can breathe normally",
            "normal breathing",
            "no breathing problem"
        ])
    ) {
        features.breathing = "Normal";
        features.shortness_of_breath = "No";
    }

    // --------------------------------------------------------
    // PAIN LEVEL
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "severe pain",
            "extreme pain",
            "unbearable pain",
            "very painful",
            "excruciating pain"
        ])
    ) {
        features.pain_level = "Severe";
    } else if (
        containsAny(text, [
            "moderate pain",
            "medium pain",
            "considerable pain"
        ])
    ) {
        features.pain_level = "Moderate";
    } else if (
        containsAny(text, [
            "mild pain",
            "little pain",
            "small pain",
            "slight pain",
            "minor pain"
        ])
    ) {
        features.pain_level = "Mild";
    } else if (
        containsAny(text, [
            "no pain",
            "without pain",
            "doesn't hurt",
            "does not hurt"
        ])
    ) {
        features.pain_level = "None";
    }

    // --------------------------------------------------------
    // CHEST PAIN
    // --------------------------------------------------------

    const chestPainWords = [
        "chest pain",
        "pain in chest",
        "chest hurts",
        "chest pressure",
        "chest tightness",
        "chest discomfort"
    ];

    if (
        containsAny(text, chestPainWords) &&
        !containsAny(text, [
            "no chest pain",
            "without chest pain",
            "no pain in chest"
        ]) &&
        !isNegated(text, chestPainWords)
    ) {
        features.chest_pain = "Yes";
    }

    // --------------------------------------------------------
    // SWEATING
    // --------------------------------------------------------

    const sweatingWords = [
        "sweating",
        "sweaty",
        "cold sweat",
        "excessive sweating",
        "sweating heavily"
    ];

    if (
        containsAny(text, sweatingWords) &&
        !isNegated(text, sweatingWords)
    ) {
        features.sweating = "Yes";
    }

    // --------------------------------------------------------
    // STROKE SYMPTOMS
    // --------------------------------------------------------

    const faceWords = [
        "face drooping",
        "facial droop",
        "drooping face",
        "face is drooping"
    ];

    if (
        containsAny(text, faceWords) &&
        !isNegated(text, faceWords)
    ) {
        features.face_drooping = "Yes";
    }

    const armWords = [
        "arm weakness",
        "weak arm",
        "cannot lift arm",
        "can't lift arm",
        "one arm weak",
        "arm feels weak"
    ];

    if (
        containsAny(text, armWords) &&
        !isNegated(text, armWords)
    ) {
        features.arm_weakness = "Yes";
    }

    const speechWords = [
        "speech difficulty",
        "slurred speech",
        "cannot speak",
        "can't speak",
        "difficulty speaking",
        "speech problem",
        "unable to speak"
    ];

    if (
        containsAny(text, speechWords) &&
        !isNegated(text, speechWords)
    ) {
        features.speech_difficulty = "Yes";
    }

    // --------------------------------------------------------
    // VOMITING
    // --------------------------------------------------------

    const vomitingWords = [
        "vomiting",
        "vomited",
        "throwing up",
        "threw up",
        "feeling nauseous"
    ];

    if (
        containsAny(text, vomitingWords) &&
        !isNegated(text, vomitingWords)
    ) {
        features.vomiting = "Yes";
    }

    // --------------------------------------------------------
    // SEIZURES
    // --------------------------------------------------------

    const seizureWords = [
        "seizure",
        "seizures",
        "convulsions",
        "convulsing",
        "fits",
        "having a fit"
    ];

    if (
        containsAny(text, seizureWords) &&
        !isNegated(text, seizureWords)
    ) {
        features.seizures = "Yes";
    }

    // --------------------------------------------------------
    // POISONING
    // --------------------------------------------------------

    if (
        type.includes("poison") ||
        containsAny(text, [
            "poisoning",
            "swallowed poison",
            "drank poison",
            "chemical ingestion",
            "overdose",
            "toxic substance"
        ])
    ) {
        features.poison_type = "Unknown";

        if (
            containsAny(text, [
                "pesticide",
                "insecticide",
                "rat poison"
            ])
        ) {
            features.poison_type = "Chemical";
        } else if (
            containsAny(text, [
                "medicine overdose",
                "pill overdose",
                "too many tablets",
                "overdose of medicine"
            ])
        ) {
            features.poison_type = "Medicine";
        }
    }

    // --------------------------------------------------------
    // BURNS AND ELECTRIC SHOCK
    // --------------------------------------------------------

    if (
        type.includes("burn") ||
        containsAny(text, [
            "burn",
            "burned",
            "burnt",
            "scald",
            "electric shock",
            "electrocuted"
        ])
    ) {
        if (
            containsAny(text, [
                "electric shock",
                "electrocuted",
                "electrical shock"
            ])
        ) {
            features.entry_exit_burn = "Electric";
        } else {
            features.entry_exit_burn = "Yes";
        }

        if (
            containsAny(text, [
                "muscle spasm",
                "muscle cramps",
                "muscle contraction"
            ])
        ) {
            features.muscle_spasm = "Yes";
        }

        if (
            containsAny(text, [
                "fell after shock",
                "fell after electric shock",
                "collapsed after shock"
            ])
        ) {
            features.fall_after_shock = "Yes";
        }
    }

    // --------------------------------------------------------
    // SWEATING
    // --------------------------------------------------------

    const sweatingWords = [
        "sweating",
        "sweaty",
        "cold sweat",
        "excessive sweating"
    ];

    if (
        containsAny(text, sweatingWords) &&
        !containsAny(text, [
            "no sweating",
            "not sweating",
            "without sweating"
        ]) &&
        !isNegated(text, sweatingWords)
    ) {
        features.sweating = "Yes";
    }

    // --------------------------------------------------------
    // STROKE SYMPTOMS
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "face drooping",
            "drooping face",
            "face is drooping",
            "facial droop"
        ]) &&
        !containsAny(text, [
            "no face drooping",
            "no facial droop",
            "face is not drooping"
        ])
    ) {
        features.face_drooping = "Yes";
    }

    if (
        containsAny(text, [
            "arm weakness",
            "weak arm",
            "arm is weak",
            "weakness in arm",
            "cannot move arm",
            "can't move arm"
        ]) &&
        !containsAny(text, [
            "no arm weakness",
            "no weakness in arm",
            "arms are not weak"
        ])
    ) {
        features.arm_weakness = "Yes";
    }

    if (
        containsAny(text, [
            "speech difficulty",
            "difficulty speaking",
            "cannot speak",
            "can't speak",
            "slurred speech",
            "speech problem",
            "unable to speak"
        ]) &&
        !containsAny(text, [
            "no speech difficulty",
            "speaking normally",
            "speech is normal"
        ])
    ) {
        features.speech_difficulty = "Yes";
    }

    // --------------------------------------------------------
    // VOMITING
    // --------------------------------------------------------

    const vomitingWords = [
        "vomiting",
        "vomit",
        "throwing up"
    ];

    if (
        containsAny(text, vomitingWords) &&
        !containsAny(text, [
            "no vomiting",
            "not vomiting",
            "no vomit",
            "has not vomited"
        ]) &&
        !isNegated(text, vomitingWords)
    ) {
        features.vomiting = "Yes";
    }

    // --------------------------------------------------------
    // SEIZURES
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "seizure",
            "seizures",
            "convulsion",
            "convulsions",
            "fits",
            "having a fit"
        ]) &&
        !containsAny(text, [
            "no seizure",
            "no seizures",
            "no convulsions",
            "not having a seizure"
        ])
    ) {
        features.seizures = "Yes";
    }

    // --------------------------------------------------------
    // HEAD INJURY
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "head injury",
            "hit my head",
            "hit his head",
            "hit her head",
            "head wound",
            "head bleeding",
            "injured my head",
            "head trauma"
        ]) &&
        !containsAny(text, [
            "no head injury",
            "did not hit my head",
            "did not hit his head",
            "did not hit her head"
        ])
    ) {
        features.head_injury = "Yes";
        features.injury_location = "Head";
    }

    // --------------------------------------------------------
    // FRACTURE
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "fracture",
            "broken bone",
            "bone is broken",
            "broken arm",
            "broken leg"
        ]) &&
        !containsAny(text, [
            "no fracture",
            "no broken bone",
            "no broken bones"
        ])
    ) {
        features.visible_fracture = "Yes";
        features.visible_injury = "Yes";
    }

    // --------------------------------------------------------
    // TRAPPED
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "trapped",
            "stuck",
            "cannot get out",
            "can't get out",
            "trapped inside"
        ]) &&
        !containsAny(text, [
            "not trapped",
            "not stuck",
            "isn't trapped"
        ])
    ) {
        features.trapped = "Yes";
    }

    // --------------------------------------------------------
    // CPR
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "cpr required",
            "perform cpr",
            "doing cpr",
            "cardiac arrest",
            "heart stopped"
        ])
    ) {
        features.cpr_required = "Yes";
    }

    // --------------------------------------------------------
    // WEAPON / ASSAULT
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "gunshot",
            "knife wound",
            "weapon involved",
            "stabbed",
            "stabbing",
            "shooting",
            "bullet wound"
        ])
    ) {
        features.weapon_involved = "Yes";
        features.visible_injury = "Yes";
    }

    // --------------------------------------------------------
    // ELECTRIC SHOCK
    // --------------------------------------------------------

    const electricShockDetected =
        type.includes("electric") ||
        containsAny(text, [
            "electric shock",
            "electrical shock",

            "electrocuted",
            "electric current",
            "electrocution"
        ]);

    if (electricShockDetected) {
        features.injury_type = "Electric Shock";

        // Do not automatically mark a fall after shock.
        // That requires an explicit description.
        if (
            containsAny(text, [
                "fell after shock",
                "fall after shock",
                "collapsed after shock",
                "fell after electric shock"
            ])
        ) {
            features.fall_after_shock = "Yes";
        }

        if (
            containsAny(text, [
                "muscle spasm",
                "muscle spasms",
                "muscle cramp",
                "muscle cramps"
            ])
        ) {
            features.muscle_spasm = "Yes";
        }
    }

    // --------------------------------------------------------
    // BURNS
    // --------------------------------------------------------

    const burnDetected =
        type.includes("burn") ||
        containsAny(text, [
            "burn injury",
            "burn",
            "burned",
            "burnt",
            "severe burn",
            "electric burn"
        ]);

    if (burnDetected) {
        features.injury_type = "Burn";

        // Generic burns do not establish entry/exit burn marks.
        if (
            containsAny(text, [
                "entry and exit burn",
                "entry-exit burn",
                "entry burn and exit burn",
                "entry wound and exit wound"
            ])
        ) {
            features.entry_exit_burn = "Yes";
        }
    }

    // --------------------------------------------------------
    // POISONING
    // --------------------------------------------------------

    if (
        type.includes("poison") ||
        containsAny(text, [
            "poisoning",
            "poisoned",
            "toxic substance",
            "toxin"
        ])
    ) {
        features.poison_type = "Poison";
        features.injury_type = "Poisoning";
    }

    // --------------------------------------------------------
    // DROWNING / WATER
    // --------------------------------------------------------

    if (
        type.includes("drown") ||
        containsAny(text, [
            "drowning",
            "drowned",
            "fell into water",
            "water accident",
            "near drowning"
        ])
    ) {
        features.water_type = "Water";
        features.injury_type = "Drowning";

        // Water inhalation is marked only when described.
        if (
            containsAny(text, [
                "water inhalation",
                "inhaled water",
                "water in lungs",
                "breathed water"
            ])
        ) {
            features.water_inhalation = "Yes";
        }
    }

    if (
        containsAny(text, [
            "water inhalation",
            "inhaled water",
            "water in lungs",
            "breathed water"
        ])
    ) {
        features.water_inhalation = "Yes";
    }

    // --------------------------------------------------------
    // ANIMAL BITES
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "dog bite",
            "dog bit",
            "bitten by dog"
        ])
    ) {
        features.animal_type = "Dog";
        features.venomous = "No";
        features.injury_type = "Animal Bite";
        features.visible_injury = "Yes";
    }

    if (
        containsAny(text, [
            "snake bite",
            "snakebite",
            "snake bit",
            "bitten by snake"
        ])
    ) {
        features.animal_type = "Snake";
        features.injury_type = "Animal Bite";
        features.visible_injury = "Yes";

        // Do not infer venom status from the animal alone.
        if (
            containsAny(text, [
                "venomous",
                "venom",
                "poisonous snake",
                "cobra",
                "viper"
            ])
        ) {
            features.venomous = "Yes";
        }
    }

    // --------------------------------------------------------
    // BITE LOCATION
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "bite on hand",
            "bitten on hand",
            "bite on finger"
        ])
    ) {
        features.bite_location = "Hand";
    } else if (
        containsAny(text, [
            "bite on arm",
            "bitten on arm"
        ])
    ) {
        features.bite_location = "Arm";
    } else if (
        containsAny(text, [
            "bite on leg",
            "bitten on leg"
        ])
    ) {
        features.bite_location = "Leg";
    } else if (
        containsAny(text, [
            "bite on foot",
            "bitten on foot"
        ])
    ) {
        features.bite_location = "Foot";
    } else if (
        containsAny(text, [
            "bite on face",
            "bitten on face"
        ])
    ) {
        features.bite_location = "Face";
    }

    // --------------------------------------------------------
    // INJURY LOCATION
    // --------------------------------------------------------

    if (
        text.includes("head") ||
        text.includes("forehead")
    ) {
        features.injury_location = "Head";
    } else if (text.includes("chest")) {
        features.injury_location = "Chest";
    } else if (
        text.includes("arm") ||
        text.includes("hand")
    ) {
        features.injury_location = "Arm";
    } else if (
        text.includes("leg") ||
        text.includes("knee") ||
        text.includes("foot")
    ) {
        features.injury_location = "Leg";
    }

    // --------------------------------------------------------
    // VISIBLE INJURY
    // --------------------------------------------------------

    const explicitVisibleInjury = containsAny(text, [
        "visible injury",
        "visible wound",
        "open wound",
        "deep wound",

        "large wound",
        "severe wound",
        "open cut",
        "deep cut",
        "large cut",
        "blood coming from wound"
    ]);

    const explicitNoVisibleInjury = containsAny(text, [
        "no visible injury",
        "no visible injuries",
        "no visible wound",
        "no wound",
        "no wounds",
        "no injury",
        "no injuries",
        "without injury",
        "without injuries",
        "without wound",
        "without wounds"
    ]);

    if (explicitNoVisibleInjury) {
        features.visible_injury = "No";
    } else if (explicitVisibleInjury) {
        features.visible_injury = "Yes";
    }

    // --------------------------------------------------------
    // ACCIDENT TYPE
    // --------------------------------------------------------

    if (
        type.includes("accident") &&
        features.accident_level === "None"
    ) {
        features.accident_level = notSerious
            ? "Minor"
            : serious
                ? "Severe"
                : "Moderate";
    }

    // --------------------------------------------------------
    // FINAL NEGATION OVERRIDES
    // --------------------------------------------------------

    if (
        containsAny(text, [
            "no bleeding",
            "without bleeding",
            "not bleeding"
        ])
    ) {
        features.bleeding = "No";
    }

    if (
        containsAny(text, [
            "no visible injury",
            "no visible injuries",
            "no visible wound",
            "no injury",
            "no injuries",
            "no wound",
            "no wounds",
            "without injury",
            "without injuries"
        ])
    ) {
        features.visible_injury = "No";
    }

    if (
        containsAny(text, [
            "breathing normally",
            "breathing normal",
            "breathing fine",
            "normal breathing",
            "no breathing problem"
        ])
    ) {
        features.breathing = "Normal";
        features.shortness_of_breath = "No";
    }

    console.log("SMARTEMS ML FEATURES");
    console.table(features);

    return features;
}


// ============================================================
// LOGIN
// ============================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email")?.value.trim();


            const password =
                document.getElementById("password")?.value.trim();


            if (!email || !password) {

                alert(
                    "Please enter email and password."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/auth/login`,
                        {

                            method: "POST",

                            headers: JSON_HEADERS,

                            body: JSON.stringify({
                                email,
                                password
                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Login failed."
                    );

                    return;

                }


                localStorage.setItem(
                    "meddispatchUser",
                    JSON.stringify(data.user)
                );


                alert("Login successful!");


                window.location.href =
                    "dashboard.html";

            }
            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "Cannot connect to MedDispatch backend."
                );

            }

        }
    );

}


// ============================================================
// SIGNUP
// ============================================================

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById("name")?.value.trim();

            const email =
                document.getElementById("email")?.value.trim();

            const phone =

                document.getElementById("phone")?.value.trim();


            const password =
                document.getElementById("password")?.value.trim();


            const confirmPassword =
                document.getElementById("confirmPassword")?.value.trim();


            if (
                !name ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
            ) {

                alert("Please fill all required fields.");

                return;

            }


            if (password !== confirmPassword) {

                alert("Passwords do not match.");

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/auth/signup`,
                        {
                            method: "POST",
                            headers: JSON_HEADERS,
                            body: JSON.stringify({
                                name,
                                email,
                                phone,
                                password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Registration failed."
                    );

                    return;

                }


                alert("Account created successfully!");


                window.location.href = "login.html";

            }
            catch (error) {

                console.error("Signup error:", error);


                alert(
                    "Cannot connect to MedDispatch backend."
                );

            }

        }
    );

}


// ============================================================
// SOS → ML → DISPATCH → TRACKING
// ============================================================

const sosButton =
    document.getElementById("sosButton");


if (sosButton) {

    sosButton.addEventListener(
        "click",
        function () {

            const locationStatus =
                document.getElementById("locationStatus");


            const sosText =
                sosButton.querySelector(".sos-text");


            const patientName =
                document.getElementById("patientName")?.value.trim();


            const patientAge =
                document.getElementById("patientAge")?.value.trim();


            const patientPhone =
                document.getElementById("patientPhone")?.value.trim();


            const emergencyType =
                document.getElementById("emergencyType")?.value;


            const symptoms =
                document.getElementById("symptoms")?.value.trim();


            // =================================================
            // VALIDATION
            // =================================================

            if (!patientName) {

                alert("Please enter patient name.");

                return;

            }


            if (!patientAge) {

                alert("Please enter patient age.");

                return;

            }


            if (!emergencyType) {

                alert("Please select emergency type.");

                return;

            }


            // =================================================
            // EXTRACT 34 ML FEATURES
            // =================================================

            const features =
                extractMLFeatures(
                    emergencyType,
                    symptoms,
                    patientAge
                );


            console.log("FINAL FEATURES SENT TO ML:");

            console.table(features);


            sosButton.disabled = true;

            if (sosText) {

                sosText.textContent = "ACTIVATING...";

            }


            // =================================================
            // CHECK GEOLOCATION
            // =================================================

            if (!navigator.geolocation) {

                alert("Location services are not supported.");

                sosButton.disabled = false;

                return;

            }


            if (locationStatus) {

                locationStatus.textContent =
                    "Detecting your location...";

            }


            navigator.geolocation.getCurrentPosition(

                async function (position) {

                    const latitude =
                        position.coords.latitude;


                    const longitude =
                        position.coords.longitude;


                    if (locationStatus) {

                        locationStatus.textContent =
                            "Sending emergency details to AI triage...";

                    }


                    try {

                        // =====================================
                        // COMPLETE EMERGENCY PAYLOAD
                        // =====================================

                        const emergencyPayload = {

                            patient_name: patientName,

                            age: Number(patientAge),

                            phone: patientPhone || null,

                            emergency_type: emergencyType,

                            incident_location:
                                `${latitude}, ${longitude}`,

                            bleeding: features.bleeding,

                            conscious: features.conscious,

                            breathing: features.breathing,

                            accident_level: features.accident_level,

                            visible_fracture: features.visible_fracture,

                            trapped: features.trapped,

                            injury_type: features.injury_type,

                            pain_level: features.pain_level,

                            chest_pain: features.chest_pain,

                            sweating: features.sweating,

                            shortness_of_breath:
                                features.shortness_of_breath,

                            face_drooping: features.face_drooping,

                            arm_weakness: features.arm_weakness,

                            speech_difficulty:
                                features.speech_difficulty,

                            poison_type: features.poison_type,

                            vomiting: features.vomiting,

                            seizures: features.seizures,

                            entry_exit_burn: features.entry_exit_burn,

                            muscle_spasm: features.muscle_spasm,

                            fall_after_shock: features.fall_after_shock,

                            water_type: features.water_type,

                            water_inhalation: features.water_inhalation,

                            cpr_required: features.cpr_required,

                            fall_height: features.fall_height,

                            head_injury: features.head_injury,

                            animal_type: features.animal_type,

                            bite_location: features.bite_location,

                            venomous: features.venomous,

                            weapon_involved: features.weapon_involved,

                            injury_location: features.injury_location,

                            visible_injury: features.visible_injury

                        };


                        console.log("================================");

                        console.log("ML INPUT PAYLOAD");

                        console.log(emergencyPayload);

                        console.log("================================");


                        // =====================================
                        // SEND TO NODE BACKEND
                        // =====================================

                        const emergencyResponse =
                            await fetch(
                                `${API_BASE}/api/emergencies`,
                                {
                                    method: "POST",
                                    headers: JSON_HEADERS,
                                    body: JSON.stringify(
                                        emergencyPayload
                                    )
                                }
                            );


                        const emergencyData =
                            await emergencyResponse.json();


                        console.log(
                            "Backend response:",
                            emergencyData
                        );


                        if (!emergencyResponse.ok) {

                            throw new Error(
                                emergencyData.message ||
                                "Failed to create emergency"
                            );

                        }

                },


                // =================================================
                // GEOLOCATION ERROR
                // =================================================

                function (error) {

                    console.error(
                        "Location error:",
                        error
                    );


                    alert(
                        "Unable to detect your location. Please allow location access."
                    );


                    sosButton.disabled = false;


                    if (sosText) {

                        sosText.textContent =
                            "GET EMERGENCY HELP";

                    }

                },


                // =================================================
                // GEOLOCATION OPTIONS
                // =================================================

                {

                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 0

                }

            );

        }
    );

}


// ============================================================
// ADMIN LOGIN
// ============================================================

const adminLoginForm =
    document.getElementById("adminLoginForm");


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const adminEmail =
                document.getElementById("adminEmail")?.value.trim();


            const adminPassword =
                document.getElementById("adminPassword")?.value.trim();


            if (!adminEmail || !adminPassword) {

                alert(
                    "Please enter admin email and password."
                );

                return;

            }


            window.location.href =
                "admin-dashboard.html";

        }
    );

}


// ============================================================
// END
// ============================================================

console.log(
    "SmartEMS complete script loaded successfully."
);
