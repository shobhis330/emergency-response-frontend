console.log("SmartEMS initialized");

const API_BASE = "https://meddispatch-backend.onrender.com";
const JSON_HEADERS = { "Content-Type": "application/json" };

// ============================================================
// LOGIN → BACKEND → DASHBOARD
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        try {
            const response = await fetch(
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

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed.");
                return;
            }

            localStorage.setItem(
                "meddispatchUser",
                JSON.stringify(data.user)
            );

            alert("Login successful!");

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            alert(
                "Cannot connect to MedDispatch backend. Make sure the backend server is running."
            );
        }
    });
}


// ============================================================
// SIGNUP → BACKEND
// ============================================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value.trim();

        const confirmPassword =
            document.getElementById("confirmPassword").value.trim();

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
            const response = await fetch(
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

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                    "Registration failed."
                );
                return;
            }

            alert("Account created successfully!");

            window.location.href = "login.html";

        } catch (error) {
            console.error("Signup error:", error);

            alert(
                "Cannot connect to MedDispatch backend. Make sure the backend server is running."
            );
        }
    });
}


// ============================================================
// SOS → BACKEND → ML → DISPATCH → TRACKING
// ============================================================

const sosButton =
    document.getElementById("sosButton");

if (sosButton) {

    sosButton.addEventListener("click", () => {

        const locationStatus =
            document.getElementById("locationStatus");

        const sosText =
            sosButton.querySelector(".sos-text");


        // --------------------------------------------------------
        // GET PATIENT FORM DATA
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // DISABLE SOS BUTTON
        // --------------------------------------------------------

        sosButton.disabled = true;

        if (sosText) {
            sosText.textContent = "ACTIVATING...";
        }

        if (locationStatus) {
            locationStatus.textContent =
                "Detecting your location...";
        }


        // --------------------------------------------------------
        // CHECK GEOLOCATION
        // --------------------------------------------------------

        if (!navigator.geolocation) {

            alert(
                "Location services are not supported by this browser."
            );

            sosButton.disabled = false;

            if (sosText) {
                sosText.textContent =
                    "GET EMERGENCY HELP";
            }

            return;
        }


        // --------------------------------------------------------
        // GET CURRENT LOCATION
        // --------------------------------------------------------

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                console.log("Latitude:", latitude);
                console.log("Longitude:", longitude);


                if (locationStatus) {

                    locationStatus.textContent =
                        `Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                }


                try {

                    // ------------------------------------------------
                    // SEND EMERGENCY TO BACKEND
                    // ------------------------------------------------

                    if (locationStatus) {

                        locationStatus.textContent =
                            "Sending emergency details to backend...";

                    }


                    const emergencyPayload = {

                        // PATIENT INFORMATION

                        patient_name:
                            patientName,

                        age:
                            Number(patientAge),

                        phone:
                            patientPhone || null,


                        // EMERGENCY INFORMATION

                        emergency_type:
                            emergencyType,

                        incident_location:
                            `${latitude}, ${longitude}`,


                        // ------------------------------------------------
                        // 34 ML MODEL FEATURES
                        // ------------------------------------------------

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
                            symptoms || "Unknown",

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


                    // ------------------------------------------------
                    // CALL RENDER BACKEND
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // READ BACKEND RESPONSE
                    // ------------------------------------------------

                    const emergencyData =
                        await emergencyResponse.json();

                    console.log(
                        "Emergency Backend Response:",
                        emergencyData
                    );


                    // ------------------------------------------------
                    // CHECK BACKEND RESPONSE
                    // ------------------------------------------------

                    if (!emergencyResponse.ok) {

                        throw new Error(
                            emergencyData.message ||
                            "Failed to create emergency"
                        );

                    }


                    // ------------------------------------------------
                    // GET REAL ML PREDICTION
                    // ------------------------------------------------

                    const mlPriority =
                        emergencyData
                            .emergency
                            ?.triage_priority;


                    const mlProbabilities =
                        emergencyData
                            .emergency
                            ?.triage_probabilities;


                    console.log(
                        "================================"
                    );

                    console.log(
                        "REAL ML PREDICTION:"
                    );

                    console.log(
                        mlPriority
                    );

                    console.log(
                        "ML PROBABILITIES:"
                    );

                    console.log(
                        mlProbabilities
                    );

                    console.log(
                        "================================"
                    );


                    if (!mlPriority) {

                        throw new Error(
                            "ML prediction was not received from backend."
                        );

                    }


                    if (locationStatus) {

                        locationStatus.textContent =
                            `ML Prediction: ${mlPriority}. Assigning nearest ambulance...`;

                    }


                    // ------------------------------------------------
                    // DISPATCH AMBULANCE
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // READ DISPATCH RESPONSE
                    // ------------------------------------------------

                    const dispatchData =
                        await dispatchResponse.json();

                    console.log(
                        "Dispatch Response:",
                        dispatchData
                    );


                    // ------------------------------------------------
                    // CHECK DISPATCH RESPONSE
                    // ------------------------------------------------

                    if (!dispatchResponse.ok) {

                        throw new Error(
                            dispatchData.message ||
                            "Dispatch failed"
                        );

                    }


                    // ------------------------------------------------
                    // SAVE EMERGENCY DATA
                    // ------------------------------------------------

                    localStorage.setItem(
                        "emergencyData",
                        JSON.stringify(
                            emergencyData.emergency
                        )
                    );


                    // ------------------------------------------------
                    // SAVE DISPATCH DATA
                    // ------------------------------------------------

                    localStorage.setItem(
                        "dispatchData",
                        JSON.stringify(
                            dispatchData
                        )
                    );


                    // ------------------------------------------------
                    // SAVE PATIENT INFORMATION
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // SAVE ML RESULT
                    // ------------------------------------------------

                    localStorage.setItem(
                        "mlPrediction",
                        JSON.stringify({

                            priority:
                                mlPriority,

                            probabilities:
                                mlProbabilities

                        })
                    );


                    // ------------------------------------------------
                    // SUCCESS
                    // ------------------------------------------------

                    if (locationStatus) {

                        locationStatus.textContent =
                            `ML: ${mlPriority} | Ambulance assigned successfully.`;

                    }


                    if (sosText) {

                        sosText.textContent =
                            "AMBULANCE ASSIGNED";

                    }


                    // ------------------------------------------------
                    // REDIRECT TO TRACKING
                    // ------------------------------------------------

                    setTimeout(
                        () => {

                            window.location.href =
                                "tracking.html";

                        },
                        1000
                    );


                } catch (error) {

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


            // --------------------------------------------------------
            // LOCATION ERROR
            // --------------------------------------------------------

            (error) => {

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


            // --------------------------------------------------------
            // LOCATION OPTIONS
            // --------------------------------------------------------

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );

    });

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
        (event) => {

            event.preventDefault();


            const adminEmail =
                document.getElementById(
                    "adminEmail"
                ).value.trim();


            const adminPassword =
                document.getElementById(
                    "adminPassword"
                ).value.trim();


            if (
                !adminEmail ||
                !adminPassword
            ) {

                return;

            }


            window.location.href =
                "admin-dashboard.html";

        }
    );

}