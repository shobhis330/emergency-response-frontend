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

function extractMLFeatures(
    emergencyType,
    symptoms,
    age
) {

    const type =
        normalizeText(emergencyType);

    const symptomText =
        normalizeText(symptoms);

    const text =
        `${type} ${symptomText}`;


    console.log("========================================");
    console.log("SMARTEMS FEATURE EXTRACTION");
    console.log("========================================");
    console.log(
        "Emergency Type:",
        emergencyType
    );
    console.log(
        "User Sentence:",
        symptoms
    );
    console.log(
        "Normalized:",
        text
    );


    // ========================================================
    // DEFAULT 34 FEATURES
    // ========================================================

    const features = {

        age: Number(age) || 0,

        emergency_type:
            emergencyType || "Unknown",

        incident_location:
            "",

        bleeding:
            "No",

        conscious:
            "Yes",

        breathing:
            "Normal",

        accident_level:
            "None",

        visible_fracture:
            "No",

        trapped:
            "No",

        injury_type:
            "Unknown",

        pain_level:
            "Unknown",

        chest_pain:
            "No",

        sweating:
            "No",

        shortness_of_breath:
            "No",

        face_drooping:
            "No",

        arm_weakness:
            "No",

        speech_difficulty:
            "No",

        poison_type:
            "None",

        vomiting:
            "No",

        seizures:
            "No",

        entry_exit_burn:
            "No",

        muscle_spasm:
            "No",

        fall_after_shock:
            "No",

        water_type:
            "None",

        water_inhalation:
            "No",

        cpr_required:
            "No",

        fall_height:
            0,

        head_injury:
            "No",

        animal_type:
            "None",

        bite_location:
            "None",

        venomous:
            "No",

        weapon_involved:
            "No",

        injury_location:
            "None",

        visible_injury:
            "No"

    };


    // ========================================================
    // SERIOUS / NOT SERIOUS
    // ========================================================

    const notSerious =
        containsAny(text, [

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


    const serious =
        containsAny(text, [

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


    console.log(
        "Not Serious:",
        notSerious
    );

    console.log(
        "Serious:",
        serious
    );


    // ========================================================
    // FALL
    // ========================================================

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

        features.injury_type =
            "Fall";


        console.log(
            "Detected: FALL"
        );


        // FALL HEIGHT

        const heightMatch =
            text.match(
                /(\d+(?:\.\d+)?)\s*(feet|foot|ft|meter|meters|m)\b/
            );


        if (heightMatch) {

            let height =
                parseFloat(
                    heightMatch[1]
                );

            const unit =
                heightMatch[2];


            if (
                unit === "meter" ||
                unit === "meters" ||
                unit === "m"
            ) {

                height =
                    height * 3.28084;

            }


            features.fall_height =
                Math.round(height);


            console.log(
                "Fall Height:",
                features.fall_height
            );

        }


        // FALL AFTER ELECTRIC SHOCK

        if (
            containsAny(text, [
                "fall after shock",
                "fell after electric shock",
                "fall after electricity",
                "collapsed after shock"
            ])
        ) {

            features.fall_after_shock =
                "Yes";

        }


        // ACCIDENT SEVERITY

        if (
            serious ||
            features.fall_height >= 10 ||
            text.includes("head injury") ||
            text.includes("fracture") ||
            text.includes("broken bone") ||
            text.includes("unconscious")
        ) {

            features.accident_level =
                "Severe";

        }
        else if (notSerious) {

            features.accident_level =
                "Minor";

        }
        else {

            features.accident_level =
                "Moderate";

        }

    }


    // ========================================================
    // BLEEDING
    // ========================================================

    const bleedingWords = [

        "bleeding",
        "bleed",
        "blood",
        "bleeds",
        "blood loss"

    ];


    if (
        containsAny(
            text,
            bleedingWords
        ) &&
        !isNegated(
            text,
            bleedingWords
        )
    ) {

        features.bleeding =
            "Yes";

        console.log(
            "Detected: BLEEDING"
        );

    }
    else {

        features.bleeding =
            "No";

    }


    // ========================================================
    // CONSCIOUSNESS
    // ========================================================

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

        features.conscious =
            "No";

        console.log(
            "Detected: UNCONSCIOUS"
        );

    }
    else if (
        containsAny(text, [

            "conscious",
            "fully conscious",
            "awake",
            "awake and alert",
            "alert",
            "responsive"

        ])
    ) {

        features.conscious =
            "Yes";

    }


    // ========================================================
    // BREATHING
    // ========================================================

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
            "breathing difficulty"

        ])
    ) {

        features.breathing =
            "Difficulty";

        features.shortness_of_breath =
            "Yes";

        console.log(
            "Detected: BREATHING DIFFICULTY"
        );

    }
    else if (
        containsAny(text, [

            "breathing normally",
            "breathing normal",
            "breathing fine",
            "can breathe normally",
            "normal breathing",
            "no breathing problem"

        ])
    ) {

        features.breathing =
            "Normal";

        features.shortness_of_breath =
            "No";

    }


    // ========================================================
    // PAIN LEVEL
    // ========================================================

    if (
        containsAny(text, [

            "severe pain",
            "extreme pain",
            "unbearable pain",
            "very painful",
            "excruciating pain"

        ])
    ) {

        features.pain_level =
            "Severe";

    }
    else if (
        containsAny(text, [

            "moderate pain",
            "medium pain",
            "considerable pain"

        ])
    ) {

        features.pain_level =
            "Moderate";

    }
    else if (
        containsAny(text, [

            "mild pain",
            "little pain",
            "small pain",
            "slight pain",
            "minor pain"

        ])
    ) {

        features.pain_level =
            "Mild";

    }
    else if (
        containsAny(text, [

            "no pain",
            "without pain",
            "doesn't hurt",
            "does not hurt"

        ])
    ) {

        features.pain_level =
            "None";

    }


    // ========================================================
    // CHEST PAIN
    // ========================================================

    const chestPainWords = [

        "chest pain",
        "pain in chest",
        "chest hurts",
        "chest pressure",
        "chest tightness",
        "chest discomfort"

    ];


    if (
        containsAny(
            text,
            chestPainWords
        ) &&
        !isNegated(
            text,
            chestPainWords
        )
    ) {

        features.chest_pain =
            "Yes";

    }


    // ========================================================
    // SWEATING
    // ========================================================

    const sweatingWords = [

        "sweating",
        "sweaty",
        "cold sweat",
        "excessive sweating"

    ];


    if (
        containsAny(
            text,
            sweatingWords
        ) &&
        !isNegated(
            text,
            sweatingWords
        )
    ) {

        features.sweating =
            "Yes";

    }


    // ========================================================
    // SHORTNESS OF BREATH
    // ========================================================

    if (
        containsAny(text, [

            "shortness of breath",
            "difficulty breathing",
            "breathing difficulty",
            "breathless",
            "cannot breathe",
            "can't breathe"

        ])
    ) {

        features.shortness_of_breath =
            "Yes";

    }


    // ========================================================
    // STROKE - FACE
    // ========================================================

    if (
        containsAny(text, [

            "face drooping",
            "drooping face",
            "face is drooping",
            "facial droop"

        ])
    ) {

        features.face_drooping =
            "Yes";

    }


    // ========================================================
    // STROKE - ARM
    // ========================================================

    if (
        containsAny(text, [

            "arm weakness",
            "weak arm",
            "arm is weak",
            "weakness in arm",
            "cannot move arm",
            "can't move arm"

        ])
    ) {

        features.arm_weakness =
            "Yes";

    }


    // ========================================================
    // STROKE - SPEECH
    // ========================================================

    if (
        containsAny(text, [

            "speech difficulty",
            "difficulty speaking",
            "cannot speak",
            "can't speak",
            "slurred speech",
            "speech problem",
            "unable to speak"

        ])
    ) {

        features.speech_difficulty =
            "Yes";

    }


    // ========================================================
    // VOMITING
    // ========================================================

    const vomitingWords = [

        "vomiting",
        "vomit",
        "throwing up"

    ];


    if (
        containsAny(
            text,
            vomitingWords
        ) &&
        !isNegated(
            text,
            vomitingWords
        )
    ) {

        features.vomiting =
            "Yes";

    }


    // ========================================================
    // SEIZURES
    // ========================================================

    if (
        containsAny(text, [

            "seizure",
            "seizures",
            "convulsion",
            "convulsions",
            "fits",
            "having a fit"

        ])
    ) {

        features.seizures =
            "Yes";

    }


    // ========================================================
    // HEAD INJURY
    // ========================================================

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

        ])
    ) {

        features.head_injury =
            "Yes";

        features.injury_location =
            "Head";

        features.visible_injury =
            "Yes";

    }


    // ========================================================
    // FRACTURE
    // ========================================================

    if (
        containsAny(text, [

            "fracture",
            "broken bone",
            "bone is broken",
            "broken arm",
            "broken leg"

        ])
    ) {

        features.visible_fracture =
            "Yes";

        features.visible_injury =
            "Yes";

    }


    // ========================================================
    // TRAPPED
    // ========================================================

    if (
        containsAny(text, [

            "trapped",
            "stuck",
            "cannot get out",
            "can't get out",
            "trapped inside"

        ])
    ) {

        features.trapped =
            "Yes";

    }


    // ========================================================
    // CPR
    // ========================================================

    if (
        containsAny(text, [

            "cpr",
            "cardiac arrest",
            "heart stopped",
            "not breathing"

        ])
    ) {

        features.cpr_required =
            "Yes";

    }


    // ========================================================
    // WEAPON
    // ========================================================

    if (
        containsAny(text, [

            "gun",
            "gunshot",
            "knife",
            "weapon",
            "stabbed",
            "stabbing",
            "shooting",
            "shot",
            "bullet"

        ])
    ) {

        features.weapon_involved =
            "Yes";

        features.visible_injury =
            "Yes";

    }


    // ========================================================
    // ELECTRIC SHOCK
    // ========================================================

    if (
        containsAny(text, [

            "electric shock",
            "electrical shock",
            "electricity",
            "electrocuted",
            "electric current",
            "electrocution"

        ])
    ) {

        features.fall_after_shock =
            "Yes";

        features.injury_type =
            "Electric Shock";

    }


    // ========================================================
    // BURN
    // ========================================================

    if (
        type.includes("burn") ||
        containsAny(text, [

            "burn injury",
            "burn",
            "burned",
            "burnt",
            "severe burn",
            "electric burn"

        ])
    ) {

        features.entry_exit_burn =
            "Yes";

        features.injury_type =
            "Burn";

    }


    // ========================================================
    // POISONING
    // ========================================================

    if (
        type.includes("poison") ||
        containsAny(text, [

            "poison",
            "poisoning",
            "poisoned",
            "toxic",
            "toxin"

        ])
    ) {

        features.poison_type =
            "Poison";

        features.injury_type =
            "Poisoning";

    }


    // ========================================================
    // DROWNING / WATER
    // ========================================================

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

        features.water_type =
            "Water";

        features.water_inhalation =
            "Yes";

        features.injury_type =
            "Drowning";

    }


    if (
        containsAny(text, [

            "water inhalation",
            "inhaled water",
            "water in lungs",
            "breathed water"

        ])
    ) {

        features.water_inhalation =
            "Yes";

    }


    // ========================================================
    // DOG BITE
    // ========================================================

    if (
        text.includes("dog bite") ||
        text.includes("dog bit")
    ) {

        features.animal_type =
            "Dog";

        features.venomous =
            "No";

        features.bite_location =
            "Unknown";

        features.visible_injury =
            "Yes";

        features.injury_type =
            "Animal Bite";

    }


    // ========================================================
    // SNAKE BITE
    // ========================================================

    if (
        text.includes("snake bite") ||
        text.includes("snakebite") ||
        text.includes("snake bit")
    ) {

        features.animal_type =
            "Snake";

        features.venomous =
            "Yes";

        features.bite_location =
            "Unknown";

        features.visible_injury =
            "Yes";

        features.injury_type =
            "Animal Bite";

    }


    // ========================================================
    // BITE LOCATION
    // ========================================================

    if (
        containsAny(text, [
            "bite on hand",
            "bitten on hand",
            "bite on finger"
        ])
    ) {

        features.bite_location =
            "Hand";

    }
    else if (
        containsAny(text, [
            "bite on arm",
            "bitten on arm"
        ])
    ) {

        features.bite_location =
            "Arm";

    }
    else if (
        containsAny(text, [
            "bite on leg",
            "bitten on leg"
        ])
    ) {

        features.bite_location =
            "Leg";

    }
    else if (
        containsAny(text, [
            "bite on foot",
            "bitten on foot"
        ])
    ) {

        features.bite_location =
            "Foot";

    }
    else if (
        containsAny(text, [
            "bite on face",
            "bitten on face"
        ])
    ) {

        features.bite_location =
            "Face";

    }


    // ========================================================
    // VENOMOUS
    // ========================================================

    if (
        containsAny(text, [

            "venomous",
            "venom",
            "poisonous snake",
            "cobra",
            "viper"

        ])
    ) {

        features.venomous =
            "Yes";

    }


    // ========================================================
    // MUSCLE SPASM
    // ========================================================

    if (
        containsAny(text, [

            "muscle spasm",
            "muscle spasms",
            "muscle cramp",
            "muscle cramps",
            "cramps"

        ])
    ) {

        features.muscle_spasm =
            "Yes";

    }


    // ========================================================
    // INJURY LOCATION
    // ========================================================

    if (
        text.includes("head") ||
        text.includes("forehead")
    ) {

        features.injury_location =
            "Head";

    }
    else if (
        text.includes("chest")
    ) {

        features.injury_location =
            "Chest";

    }
    else if (
        text.includes("arm") ||
        text.includes("hand")
    ) {

        features.injury_location =
            "Arm";

    }
    else if (
        text.includes("leg") ||
        text.includes("knee") ||
        text.includes("foot")
    ) {

        features.injury_location =
            "Leg";

    }


    // ========================================================
    // GENERAL VISIBLE INJURY
    //
    // IMPORTANT:
    // "I had a minor fall" DOES NOT automatically mean
    // visible injury.
    // ========================================================

    const explicitVisibleInjury =
        containsAny(text, [

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


    const explicitNoVisibleInjury =
        containsAny(text, [

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

        features.visible_injury =
            "No";

    }
    else if (explicitVisibleInjury) {

        features.visible_injury =
            "Yes";

    }


    // ========================================================
    // ACCIDENT TYPE
    // ========================================================

    if (
        type.includes("accident") &&
        features.accident_level === "None"
    ) {

        features.accident_level =
            notSerious
                ? "Minor"
                : "Moderate";

    }


    // ========================================================
    // FINAL NEGATION OVERRIDES
    // ========================================================

    if (
        containsAny(text, [
            "no bleeding",
            "without bleeding",
            "not bleeding"
        ])
    ) {

        features.bleeding =
            "No";

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

        features.visible_injury =
            "No";

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

        features.breathing =
            "Normal";

        features.shortness_of_breath =
            "No";

    }


    // ========================================================
    // FINAL OUTPUT
    // ========================================================

    console.log(
        "========================================"
    );

    console.log(
        "SMARTEMS 34 ML FEATURES"
    );

    console.table(features);

    console.log(
        "========================================"
    );


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
                document.getElementById(
                    "email"
                )?.value.trim();


            const password =
                document.getElementById(
                    "password"
                )?.value.trim();


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

                            headers:
                                JSON_HEADERS,

                            body:
                                JSON.stringify({
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
                    JSON.stringify(
                        data.user
                    )
                );


                alert(
                    "Login successful!"
                );


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
    document.getElementById(
        "signupForm"
    );


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                )?.value.trim();


            const email =
                document.getElementById(
                    "email"
                )?.value.trim();


            const phone =
                document.getElementById(
                    "phone"
                )?.value.trim();


            const password =
                document.getElementById(
                    "password"
                )?.value.trim();


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                )?.value.trim();


            if (
                !name ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Please fill all required fields."
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/auth/signup`,
                        {

                            method: "POST",

                            headers:
                                JSON_HEADERS,

                            body:
                                JSON.stringify({

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


                alert(
                    "Account created successfully!"
                );


                window.location.href =
                    "login.html";

            }
            catch (error) {

                console.error(
                    "Signup error:",
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
// SOS → ML → DISPATCH → TRACKING
// ============================================================

const sosButton =
    document.getElementById(
        "sosButton"
    );


if (sosButton) {

    sosButton.addEventListener(
        "click",
        function () {


            const locationStatus =
                document.getElementById(
                    "locationStatus"
                );


            const sosText =
                sosButton.querySelector(
                    ".sos-text"
                );


            const patientName =
                document.getElementById(
                    "patientName"
                )?.value.trim();


            const patientAge =
                document.getElementById(
                    "patientAge"
                )?.value.trim();


            const patientPhone =
                document.getElementById(
                    "patientPhone"
                )?.value.trim();


            const emergencyType =
                document.getElementById(
                    "emergencyType"
                )?.value;


            const symptoms =
                document.getElementById(
                    "symptoms"
                )?.value.trim();


            // =================================================
            // VALIDATION
            // =================================================

            if (!patientName) {

                alert(
                    "Please enter patient name."
                );

                return;

            }


            if (!patientAge) {

                alert(
                    "Please enter patient age."
                );

                return;

            }


            if (!emergencyType) {

                alert(
                    "Please select emergency type."
                );

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


            console.log(
                "FINAL FEATURES SENT TO ML:"
            );

            console.table(
                features
            );


            sosButton.disabled =
                true;


            if (sosText) {

                sosText.textContent =
                    "ACTIVATING...";

            }


            // =================================================
            // CHECK GEOLOCATION
            // =================================================

            if (
                !navigator.geolocation
            ) {

                alert(
                    "Location services are not supported."
                );

                sosButton.disabled =
                    false;

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

                            patient_name:
                                patientName,

                            age:
                                Number(
                                    patientAge
                                ),

                            phone:
                                patientPhone ||
                                null,

                            emergency_type:
                                emergencyType,

                            incident_location:
                                `${latitude}, ${longitude}`,

                            bleeding:
                                features.bleeding,

                            conscious:
                                features.conscious,

                            breathing:
                                features.breathing,

                            accident_level:
                                features.accident_level,

                            visible_fracture:
                                features.visible_fracture,

                            trapped:
                                features.trapped,

                            injury_type:
                                features.injury_type,

                            pain_level:
                                features.pain_level,

                            chest_pain:
                                features.chest_pain,

                            sweating:
                                features.sweating,

                            shortness_of_breath:
                                features.shortness_of_breath,

                            face_drooping:
                                features.face_drooping,

                            arm_weakness:
                                features.arm_weakness,

                            speech_difficulty:
                                features.speech_difficulty,

                            poison_type:
                                features.poison_type,

                            vomiting:
                                features.vomiting,

                            seizures:
                                features.seizures,

                            entry_exit_burn:
                                features.entry_exit_burn,

                            muscle_spasm:
                                features.muscle_spasm,

                            fall_after_shock:
                                features.fall_after_shock,

                            water_type:
                                features.water_type,

                            water_inhalation:
                                features.water_inhalation,

                            cpr_required:
                                features.cpr_required,

                            fall_height:
                                features.fall_height,

                            head_injury:
                                features.head_injury,

                            animal_type:
                                features.animal_type,

                            bite_location:
                                features.bite_location,

                            venomous:
                                features.venomous,

                            weapon_involved:
                                features.weapon_involved,

                            injury_location:
                                features.injury_location,

                            visible_injury:
                                features.visible_injury

                        };


                        console.log(
                            "================================"
                        );

                        console.log(
                            "ML INPUT PAYLOAD"
                        );

                        console.log(
                            emergencyPayload
                        );

                        console.log(
                            "================================"
                        );


                        // =====================================
                        // SEND TO NODE BACKEND
                        // =====================================

                        const emergencyResponse =
                            await fetch(
                                `${API_BASE}/api/emergencies`,
                                {

                                    method:
                                        "POST",

                                    headers:
                                        JSON_HEADERS,

                                    body:
                                        JSON.stringify(
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


                        if (
                            !emergencyResponse.ok
                        ) {

                            throw new Error(
                                emergencyData.message ||
                                "Failed to create emergency"
                            );

                        }


                        // =====================================
                        // REAL ML RESULT
                        // =====================================

                        const mlPriority =
                            emergencyData
                                ?.emergency
                                ?.triage_priority;


                        const mlProbabilities =
                            emergencyData
                                ?.emergency
                                ?.triage_probabilities;


                        if (!mlPriority) {

                            throw new Error(
                                "ML prediction was not received."
                            );

                        }


                        console.log(
                            "================================"
                        );

                        console.log(
                            "REAL ML PREDICTION:",
                            mlPriority
                        );

                        console.log(
                            "ML PROBABILITIES:",
                            mlProbabilities
                        );

                        console.log(
                            "================================"
                        );


                        if (locationStatus) {

                            locationStatus.textContent =
                                `AI Triage: ${mlPriority}. Assigning nearest ambulance...`;

                        }


                        // =====================================
                        // DISPATCH
                        // =====================================

                        const dispatchResponse =
                            await fetch(
                                `${API_BASE}/api/dispatch`,
                                {

                                    method:
                                        "POST",

                                    headers:
                                        JSON_HEADERS,

                                    body:
                                        JSON.stringify({

                                            latitude:
                                                latitude,

                                            longitude:
                                                longitude,

                                            triage_priority:
                                                mlPriority

                                        })

                                }
                            );


                        const dispatchData =
                            await dispatchResponse.json();


                        console.log(
                            "Dispatch response:",
                            dispatchData
                        );


                        if (
                            !dispatchResponse.ok
                        ) {

                            throw new Error(
                                dispatchData.message ||
                                "Dispatch failed"
                            );

                        }


                        // =====================================
                        // SAVE EMERGENCY DATA
                        // =====================================

                        localStorage.setItem(
                            "emergencyData",
                            JSON.stringify(
                                emergencyData.emergency
                            )
                        );


                        // =====================================
                        // SAVE DISPATCH DATA
                        // =====================================

                        localStorage.setItem(
                            "dispatchData",
                            JSON.stringify(
                                dispatchData
                            )
                        );


                        // =====================================
                        // SAVE PATIENT INFO
                        // =====================================

                        localStorage.setItem(
                            "patientInfo",
                            JSON.stringify({

                                name:
                                    patientName,

                                age:
                                    patientAge,

                                phone:
                                    patientPhone,

                                emergency_type:
                                    emergencyType,

                                symptoms:
                                    symptoms

                            })
                        );


                        // =====================================
                        // SAVE ML RESULT
                        // =====================================

                        localStorage.setItem(
                            "mlPrediction",
                            JSON.stringify({

                                priority:
                                    mlPriority,

                                probabilities:
                                    mlProbabilities

                            })
                        );


                        // =====================================
                        // SUCCESS
                        // =====================================

                        if (locationStatus) {

                            locationStatus.textContent =
                                `AI Triage: ${mlPriority} | Ambulance assigned successfully.`;

                        }


                        if (sosText) {

                            sosText.textContent =
                                "AMBULANCE ASSIGNED";

                        }


                        // =====================================
                        // GO TO TRACKING
                        // =====================================

                        setTimeout(
                            function () {

                                window.location.href =
                                    "tracking.html";

                            },
                            1000
                        );


                    }
                    catch (error) {

                        console.error(
                            "Emergency error:",
                            error
                        );


                        alert(
                            "Emergency request failed: " +
                            error.message
                        );


                        sosButton.disabled =
                            false;


                        if (sosText) {

                            sosText.textContent =
                                "GET EMERGENCY HELP";

                        }

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


                    sosButton.disabled =
                        false;


                    if (sosText) {

                        sosText.textContent =
                            "GET EMERGENCY HELP";

                    }

                },


                // =================================================
                // GEOLOCATION OPTIONS
                // =================================================

                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        0

                }

            );

        }
    );

}


// ============================================================
// ADMIN LOGIN
// ============================================================

const adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const adminEmail =
                document.getElementById(
                    "adminEmail"
                )?.value.trim();


            const adminPassword =
                document.getElementById(
                    "adminPassword"
                )?.value.trim();


            if (
                !adminEmail ||
                !adminPassword
            ) {

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