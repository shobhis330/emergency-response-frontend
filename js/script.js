console.log("SmartEMS initialized");


// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE = "https://meddispatch-backend.onrender.com";

const JSON_HEADERS = {
    "Content-Type": "application/json"
};


// ============================================================
// LOGIN → BACKEND → DASHBOARD
// ============================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById("email")
                    ?.value.trim();

            const password =
                document.getElementById("password")
                    ?.value.trim();


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
                                email: email,
                                password: password
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
// SIGNUP → BACKEND
// ============================================================

const signupForm =
    document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById("name")
                    ?.value.trim();

            const email =
                document.getElementById("email")
                    ?.value.trim();

            const phone =
                document.getElementById("phone")
                    ?.value.trim();

            const password =
                document.getElementById("password")
                    ?.value.trim();

            const confirmPassword =
                document.getElementById("confirmPassword")
                    ?.value.trim();


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


            if (password !== confirmPassword) {

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

                            headers: JSON_HEADERS,

                            body: JSON.stringify({

                                name: name,

                                email: email,

                                phone: phone,

                                password: password

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
// EXTRACT 34 ML FEATURES
// ============================================================

function extractEmergencyFeatures(
    emergencyType,
    symptoms
) {

    const type =
        String(
            emergencyType || ""
        ).toLowerCase();

    const text =
        String(
            symptoms || ""
        ).toLowerCase();


    const combined =
        `${type} ${text}`;


    // ========================================================
    // DEFAULT VALUES
    // ========================================================

    const features = {

        bleeding: null,

        conscious: null,

        breathing: null,

        accident_level: null,

        visible_fracture: null,

        trapped: null,

        injury_type:
            symptoms || null,

        pain_level: null,

        chest_pain: null,

        sweating: null,

        shortness_of_breath: null,

        face_drooping: null,

        arm_weakness: null,

        speech_difficulty: null,

        poison_type: null,

        vomiting: null,

        seizures: null,

        entry_exit_burn: null,

        muscle_spasm: null,

        fall_after_shock: null,

        water_type: null,

        water_inhalation: null,

        cpr_required: null,

        fall_height: null,

        head_injury: null,

        animal_type: null,

        bite_location: null,

        venomous: null,

        weapon_involved: null,

        injury_location: null,

        visible_injury: null

    };


    // ========================================================
    // CONSCIOUSNESS
    // ========================================================

    if (
        combined.includes("unconscious") ||
        combined.includes("not conscious") ||
        combined.includes("unresponsive") ||
        combined.includes("not responding") ||
        combined.includes("passed out") ||
        combined.includes("fainted") ||
        combined.includes("coma")
    ) {

        features.conscious = "No";

    }

    else if (
        combined.includes("conscious") ||
        combined.includes("awake") ||
        combined.includes("alert") ||
        combined.includes("responding")
    ) {

        features.conscious = "Yes";
    }


    // ========================================================
    // BLEEDING
    // ========================================================

    if (
        combined.includes("bleeding") ||
        combined.includes("blood") ||
        combined.includes("bleeds") ||
        combined.includes("heavy bleeding") ||
        combined.includes("severe bleeding")
    ) {

        features.bleeding = "Yes";
    }


    // ========================================================
    // BREATHING
    // ========================================================

    if (
        combined.includes("not breathing") ||
        combined.includes("stopped breathing") ||
        combined.includes("cannot breathe") ||
        combined.includes("can't breathe") ||
        combined.includes("difficulty breathing") ||
        combined.includes("breathing difficulty") ||
        combined.includes("shortness of breath") ||
        combined.includes("breathless") ||
        combined.includes("breathing problem")
    ) {

        features.breathing =
            "Abnormal";

        features.shortness_of_breath =
            "Yes";
    }

    else if (
        combined.includes("normal breathing") ||
        combined.includes("breathing normally")
    ) {

        features.breathing =
            "Normal";
    }


    // ========================================================
    // CHEST PAIN
    // ========================================================

    if (
        combined.includes("chest pain") ||
        combined.includes("pain in chest") ||
        combined.includes("chest hurts") ||
        combined.includes("chest pressure") ||
        combined.includes("chest discomfort")
    ) {

        features.chest_pain =
            "Yes";
    }


    // ========================================================
    // SWEATING
    // ========================================================

    if (
        combined.includes("sweating") ||
        combined.includes("sweaty") ||
        combined.includes("cold sweat")
    ) {

        features.sweating =
            "Yes";
    }


    // ========================================================
    // SHORTNESS OF BREATH
    // ========================================================

    if (
        combined.includes("shortness of breath") ||
        combined.includes("breathlessness") ||
        combined.includes("difficulty breathing")
    ) {

        features.shortness_of_breath =
            "Yes";
    }


    // ========================================================
    // STROKE — FACE DROOPING
    // ========================================================

    if (
        combined.includes("face drooping") ||
        combined.includes("drooping face") ||
        combined.includes("face is drooping") ||
        combined.includes("one side of face")
    ) {

        features.face_drooping =
            "Yes";
    }


    // ========================================================
    // STROKE — ARM WEAKNESS
    // ========================================================

    if (
        combined.includes("arm weakness") ||
        combined.includes("weak arm") ||
        combined.includes("one arm weak") ||
        combined.includes("cannot move arm") ||
        combined.includes("can't move arm")
    ) {

        features.arm_weakness =
            "Yes";
    }


    // ========================================================
    // STROKE — SPEECH DIFFICULTY
    // ========================================================

    if (
        combined.includes("speech difficulty") ||
        combined.includes("difficulty speaking") ||
        combined.includes("cannot speak") ||
        combined.includes("can't speak") ||
        combined.includes("slurred speech") ||
        combined.includes("speech problem")
    ) {

        features.speech_difficulty =
            "Yes";
    }


    // ========================================================
    // VOMITING
    // ========================================================

    if (
        combined.includes("vomiting") ||
        combined.includes("vomit") ||
        combined.includes("vomited")
    ) {

        features.vomiting =
            "Yes";
    }


    // ========================================================
    // SEIZURES
    // ========================================================

    if (
        combined.includes("seizure") ||
        combined.includes("seizures") ||
        combined.includes("convulsion") ||
        combined.includes("convulsions") ||
        combined.includes("fits")
    ) {

        features.seizures =
            "Yes";
    }


    // ========================================================
    // CPR
    // ========================================================

    if (
        combined.includes("cpr") ||
        combined.includes(
            "cardiopulmonary resuscitation"
        ) ||
        combined.includes(
            "needs resuscitation"
        )
    ) {

        features.cpr_required =
            "Yes";
    }


    // ========================================================
    // HEAD INJURY
    // ========================================================

    if (
        combined.includes("head injury") ||
        combined.includes("head wound") ||
        combined.includes("hit the head") ||
        combined.includes("head trauma") ||
        combined.includes("injury to head")
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
        combined.includes("fracture") ||
        combined.includes("broken bone") ||
        combined.includes("broken arm") ||
        combined.includes("broken leg")
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
        combined.includes("trapped") ||
        combined.includes("stuck in vehicle") ||
        combined.includes("stuck inside") ||
        combined.includes("cannot get out") ||
        combined.includes("can't get out")
    ) {

        features.trapped =
            "Yes";
    }


    // ========================================================
    // ACCIDENT
    // ========================================================

    if (
        type.includes("accident") ||
        combined.includes("accident") ||
        combined.includes("crash") ||
        combined.includes("collision") ||
        combined.includes("road accident") ||
        combined.includes("car accident") ||
        combined.includes("bike accident") ||
        combined.includes("vehicle accident")
    ) {

        features.visible_injury =
            "Yes";


        if (
            combined.includes("severe accident") ||
            combined.includes("major accident") ||
            combined.includes("serious accident") ||
            combined.includes("bad accident") ||
            combined.includes("high speed crash") ||
            combined.includes("heavy crash")
        ) {

            features.accident_level =
                "Severe";
        }
    }


    // ========================================================
    // PAIN LEVEL
    // ========================================================

    if (
        combined.includes("severe pain") ||
        combined.includes("extreme pain") ||
        combined.includes("unbearable pain") ||
        combined.includes("very severe pain")
    ) {

        features.pain_level =
            "Severe";
    }

    else if (
        combined.includes("moderate pain") ||
        combined.includes("medium pain")
    ) {

        features.pain_level =
            "Moderate";
    }

    else if (
        combined.includes("mild pain") ||
        combined.includes("slight pain")
    ) {

        features.pain_level =
            "Mild";
    }


    // ========================================================
    // ELECTRIC SHOCK
    // ========================================================

    if (
        combined.includes("electric shock") ||
        combined.includes("electrical shock") ||
        combined.includes("electricity")
    ) {

        features.entry_exit_burn =
            "Yes";
    }


    // ========================================================
    // MUSCLE SPASM
    // ========================================================

    if (
        combined.includes("muscle spasm") ||
        combined.includes("muscle spasms") ||
        combined.includes("muscle cramp")
    ) {

        features.muscle_spasm =
            "Yes";
    }


    // ========================================================
    // FALL
    // ========================================================

    if (
        combined.includes("fall") ||
        combined.includes("fell down") ||
        combined.includes("fallen")
    ) {

        features.visible_injury =
            "Yes";


        const heightMatch =
            combined.match(
                /(\d+(?:\.\d+)?)\s*(?:feet|ft|foot|metres|meters|m)\b/
            );


        if (heightMatch) {

            features.fall_height =
                Number(heightMatch[1]);
        }
    }


    // ========================================================
    // FALL AFTER ELECTRIC SHOCK
    // ========================================================

    if (
        (
            combined.includes("electric shock") ||
            combined.includes("electrical shock")
        ) &&
        (
            combined.includes("fall") ||
            combined.includes("fell")
        )
    ) {

        features.fall_after_shock =
            "Yes";
    }


    // ========================================================
    // WATER / DROWNING
    // ========================================================

    if (
        combined.includes("drowning") ||
        combined.includes("drowned") ||
        combined.includes("under water") ||
        combined.includes("underwater") ||
        combined.includes("water inhalation") ||
        combined.includes("inhaled water")
    ) {

        features.water_inhalation =
            "Yes";

        features.water_type =
            "Water";

        features.visible_injury =
            "Yes";
    }


    // ========================================================
    // POISONING
    // ========================================================

    if (
        combined.includes("poison") ||
        combined.includes("poisoning") ||
        combined.includes("poisoned") ||
        combined.includes("toxic") ||
        combined.includes("toxin")
    ) {

        features.poison_type =
            "Poison";
    }


    // ========================================================
    // DOG BITE
    // ========================================================

    if (
        combined.includes("dog bite") ||
        combined.includes("dog bit")
    ) {

        features.animal_type =
            "Dog";

        features.venomous =
            "No";

        features.visible_injury =
            "Yes";

        features.bite_location =
            "Unknown";
    }


    // ========================================================
    // SNAKE BITE
    // ========================================================

    if (
        combined.includes("snake bite") ||
        combined.includes("snakebite") ||
        combined.includes("snake bit")
    ) {

        features.animal_type =
            "Snake";

        features.venomous =
            "Yes";

        features.visible_injury =
            "Yes";

        features.bite_location =
            "Unknown";
    }


    // ========================================================
    // WEAPON
    // ========================================================

    if (
        combined.includes("gun") ||
        combined.includes("gunshot") ||
        combined.includes("knife") ||
        combined.includes("stab") ||
        combined.includes("stabbing") ||
        combined.includes("weapon")
    ) {

        features.weapon_involved =
            "Yes";

        features.visible_injury =
            "Yes";
    }


    // ========================================================
    // INJURY LOCATION
    // ========================================================

    if (
        combined.includes("head") ||
        combined.includes("forehead")
    ) {

        features.injury_location =
            "Head";
    }

    else if (
        combined.includes("chest")
    ) {

        features.injury_location =
            "Chest";
    }

    else if (
        combined.includes("arm") ||
        combined.includes("hand")
    ) {

        features.injury_location =
            "Arm";
    }

    else if (
        combined.includes("leg") ||
        combined.includes("knee") ||
        combined.includes("foot")
    ) {

        features.injury_location =
            "Leg";
    }


    // ========================================================
    // GENERAL INJURY
    // ========================================================

    if (
        combined.includes("injury") ||
        combined.includes("injured") ||
        combined.includes("wound") ||
        combined.includes("cut") ||
        combined.includes("hurt")
    ) {

        features.visible_injury =
            "Yes";
    }


    // ========================================================
    // LOG FEATURES
    // ========================================================

    console.log(
        "================================"
    );

    console.log(
        "EXTRACTED ML FEATURES"
    );

    console.log(
        features
    );

    console.log(
        "================================"
    );


    return features;
}


// ============================================================
// SOS → BACKEND → ML → DISPATCH → TRACKING
// ============================================================

const sosButton =
    document.getElementById("sosButton");


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


            // ====================================================
            // FORM DATA
            // ====================================================

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


            // ====================================================
            // VALIDATION
            // ====================================================

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


            // ====================================================
            // EXTRACT ML FEATURES
            // ====================================================

            const extractedFeatures =
                extractEmergencyFeatures(
                    emergencyType,
                    symptoms
                );


            // ====================================================
            // DISABLE SOS
            // ====================================================

            sosButton.disabled =
                true;


            if (sosText) {

                sosText.textContent =
                    "ACTIVATING...";
            }


            if (locationStatus) {

                locationStatus.textContent =
                    "Detecting your location...";
            }


            // ====================================================
            // CHECK GEOLOCATION
            // ====================================================

            if (!navigator.geolocation) {

                alert(
                    "Location services are not supported by this browser."
                );


                sosButton.disabled =
                    false;


                if (sosText) {

                    sosText.textContent =
                        "GET EMERGENCY HELP";
                }


                return;
            }


            // ====================================================
            // GET LOCATION
            // ====================================================

            navigator.geolocation.getCurrentPosition(

                async function (position) {

                    const latitude =
                        position.coords.latitude;


                    const longitude =
                        position.coords.longitude;


                    console.log(
                        "Latitude:",
                        latitude
                    );


                    console.log(
                        "Longitude:",
                        longitude
                    );


                    if (locationStatus) {

                        locationStatus.textContent =
                            `Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    }


                    try {

                        // ========================================
                        // CREATE EMERGENCY PAYLOAD
                        // ========================================

                        const emergencyPayload = {

                            // PATIENT INFORMATION

                            patient_name:
                                patientName,

                            age:
                                Number(
                                    patientAge
                                ),

                            phone:
                                patientPhone ||
                                null,


                            // EMERGENCY INFORMATION

                            emergency_type:
                                emergencyType,

                            incident_location:
                                `${latitude}, ${longitude}`,


                            // ====================================
                            // 34 ML FEATURES
                            // ====================================

                            bleeding:
                                extractedFeatures.bleeding,

                            conscious:
                                extractedFeatures.conscious,

                            breathing:
                                extractedFeatures.breathing,

                            accident_level:
                                extractedFeatures.accident_level,

                            visible_fracture:
                                extractedFeatures.visible_fracture,

                            trapped:
                                extractedFeatures.trapped,

                            injury_type:
                                extractedFeatures.injury_type,

                            pain_level:
                                extractedFeatures.pain_level,

                            chest_pain:
                                extractedFeatures.chest_pain,

                            sweating:
                                extractedFeatures.sweating,

                            shortness_of_breath:
                                extractedFeatures.shortness_of_breath,

                            face_drooping:
                                extractedFeatures.face_drooping,

                            arm_weakness:
                                extractedFeatures.arm_weakness,

                            speech_difficulty:
                                extractedFeatures.speech_difficulty,

                            poison_type:
                                extractedFeatures.poison_type,

                            vomiting:
                                extractedFeatures.vomiting,

                            seizures:
                                extractedFeatures.seizures,

                            entry_exit_burn:
                                extractedFeatures.entry_exit_burn,

                            muscle_spasm:
                                extractedFeatures.muscle_spasm,

                            fall_after_shock:
                                extractedFeatures.fall_after_shock,

                            water_type:
                                extractedFeatures.water_type,

                            water_inhalation:
                                extractedFeatures.water_inhalation,

                            cpr_required:
                                extractedFeatures.cpr_required,

                            fall_height:
                                extractedFeatures.fall_height,

                            head_injury:
                                extractedFeatures.head_injury,

                            animal_type:
                                extractedFeatures.animal_type,

                            bite_location:
                                extractedFeatures.bite_location,

                            venomous:
                                extractedFeatures.venomous,

                            weapon_involved:
                                extractedFeatures.weapon_involved,

                            injury_location:
                                extractedFeatures.injury_location,

                            visible_injury:
                                extractedFeatures.visible_injury

                        };


                        // ========================================
                        // SHOW PAYLOAD IN CONSOLE
                        // ========================================

                        console.log(
                            "================================"
                        );

                        console.log(
                            "ML INPUT PAYLOAD:"
                        );

                        console.log(
                            emergencyPayload
                        );

                        console.log(
                            "================================"
                        );


                        if (locationStatus) {

                            locationStatus.textContent =
                                "Sending emergency details to AI triage...";
                        }


                        // ========================================
                        // SEND TO RENDER BACKEND
                        // ========================================

                        const emergencyResponse =
                            await fetch(
                                `${API_BASE}/api/emergencies`,
                                {
                                    method: "POST",

                                    headers:
                                        JSON_HEADERS,

                                    body:
                                        JSON.stringify(
                                            emergencyPayload
                                        )
                                }
                            );


                        // ========================================
                        // READ BACKEND RESPONSE
                        // ========================================

                        const emergencyData =
                            await emergencyResponse.json();


                        console.log(
                            "Emergency Backend Response:",
                            emergencyData
                        );


                        // ========================================
                        // CHECK RESPONSE
                        // ========================================

                        if (!emergencyResponse.ok) {

                            throw new Error(
                                emergencyData.message ||
                                "Failed to create emergency"
                            );
                        }


                        // ========================================
                        // REAL ML RESULT
                        // ========================================

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
                                "ML prediction was not received from backend."
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


                        // ========================================
                        // DISPATCH AMBULANCE
                        // ========================================

                        const dispatchResponse =
                            await fetch(
                                `${API_BASE}/api/dispatch`,
                                {
                                    method: "POST",

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


                        // ========================================
                        // READ DISPATCH RESPONSE
                        // ========================================

                        const dispatchData =
                            await dispatchResponse.json();


                        console.log(
                            "Dispatch Response:",
                            dispatchData
                        );


                        // ========================================
                        // CHECK DISPATCH
                        // ========================================

                        if (!dispatchResponse.ok) {

                            throw new Error(
                                dispatchData.message ||
                                "Dispatch failed"
                            );
                        }


                        // ========================================
                        // SAVE EMERGENCY
                        // ========================================

                        localStorage.setItem(
                            "emergencyData",
                            JSON.stringify(
                                emergencyData.emergency
                            )
                        );


                        // ========================================
                        // SAVE DISPATCH
                        // ========================================

                        localStorage.setItem(
                            "dispatchData",
                            JSON.stringify(
                                dispatchData
                            )
                        );


                        // ========================================
                        // SAVE PATIENT INFORMATION
                        // ========================================

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


                        // ========================================
                        // SAVE ML RESULT
                        // ========================================

                        localStorage.setItem(
                            "mlPrediction",
                            JSON.stringify({

                                priority:
                                    mlPriority,

                                probabilities:
                                    mlProbabilities

                            })
                        );


                        // ========================================
                        // SUCCESS
                        // ========================================

                        if (locationStatus) {

                            locationStatus.textContent =
                                `AI Triage: ${mlPriority} | Ambulance assigned successfully.`;
                        }


                        if (sosText) {

                            sosText.textContent =
                                "AMBULANCE ASSIGNED";
                        }


                        // ========================================
                        // GO TO TRACKING
                        // ========================================

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
                            "Emergency request error:",
                            error
                        );


                        if (locationStatus) {

                            locationStatus.textContent =
                                "Unable to process emergency request.";
                        }


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


                // ====================================================
                // LOCATION ERROR
                // ====================================================

                function (error) {

                    console.error(
                        "Location error:",
                        error
                    );


                    let message =
                        "Unable to detect your location.";


                    if (error.code === 1) {

                        message =
                            "Location permission was denied. Please allow location access.";
                    }

                    else if (error.code === 2) {

                        message =
                            "Location information is unavailable.";
                    }

                    else if (error.code === 3) {

                        message =
                            "Location request timed out.";
                    }


                    if (locationStatus) {

                        locationStatus.textContent =
                            message;
                    }


                    alert(message);


                    sosButton.disabled =
                        false;


                    if (sosText) {

                        sosText.textContent =
                            "GET EMERGENCY HELP";
                    }

                },


                // ====================================================
                // GEOLOCATION OPTIONS
                // ====================================================

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
// ADMIN LOGIN → ADMIN DASHBOARD
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