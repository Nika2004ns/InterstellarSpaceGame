/* =========================================================
   NIKAS
   INTERSTELLAR SPACE QUEST
   ========================================================= */


/* =========================================================
   CANVAS SPACE ENGINE
   ========================================================= */

const canvas =
    document.getElementById("spaceCanvas");

const ctx =
    canvas.getContext("2d");


let canvasWidth = 0;

let canvasHeight = 0;

let stars = [];

let shootingStars = [];

let pointerX = 0;

let pointerY = 0;

let targetX = 0;

let targetY = 0;

let lastTime =
    performance.now();


const reduceMotion =
    window.matchMedia &&
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


/* =========================================================
   STAR CONFIGURATION
   ========================================================= */

const starLayers = [

    {
        count: 100,
        minSize: 0.5,
        maxSize: 1.1,
        minAlpha: 0.2,
        maxAlpha: 0.5,
        speed: 5,
        parallax: 5
    },

    {
        count: 75,
        minSize: 0.8,
        maxSize: 1.8,
        minAlpha: 0.3,
        maxAlpha: 0.7,
        speed: 10,
        parallax: 12
    },

    {
        count: 45,
        minSize: 1.3,
        maxSize: 2.5,
        minAlpha: 0.5,
        maxAlpha: 1,
        speed: 17,
        parallax: 22
    }

];


/* =========================================================
   RESIZE CANVAS
   ========================================================= */

function resizeCanvas() {

    canvasWidth =
        window.innerWidth;

    canvasHeight =
        window.innerHeight;


    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        canvasWidth * dpr;

    canvas.height =
        canvasHeight * dpr;


    canvas.style.width =
        canvasWidth + "px";

    canvas.style.height =
        canvasHeight + "px";


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    createStars();

}


/* =========================================================
   CREATE STARS
   ========================================================= */

function createStars() {

    stars = [];


    starLayers.forEach(
        (layer, layerIndex) => {

            for (
                let i = 0;
                i < layer.count;
                i++
            ) {

                stars.push({

                    layer:
                        layerIndex,

                    x:
                        Math.random() *
                        canvasWidth,

                    y:
                        Math.random() *
                        canvasHeight,

                    size:
                        layer.minSize +
                        Math.random() *
                        (
                            layer.maxSize -
                            layer.minSize
                        ),

                    alpha:
                        layer.minAlpha +
                        Math.random() *
                        (
                            layer.maxAlpha -
                            layer.minAlpha
                        ),

                    speed:
                        layer.speed,

                    parallax:
                        layer.parallax,

                    twinkle:
                        Math.random() *
                        Math.PI * 2,

                    twinkleSpeed:
                        0.4 +
                        Math.random()
                        * 1.2

                });

            }

        }
    );

}


/* =========================================================
   SHOOTING STAR
   ========================================================= */

function createShootingStar() {

    const startX =
        Math.random() *
        canvasWidth *
        0.7;


    const startY =
        Math.random() *
        canvasHeight *
        0.3;


    const angle =
        Math.PI / 4 +
        (
            Math.random() *
            0.3 -
            0.15
        );


    const speed =
        7 +
        Math.random() * 6;


    shootingStars.push({

        x: startX,

        y: startY,

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,

        life: 0,

        maxLife:
            45 +
            Math.random() * 30,

        length:
            80 +
            Math.random() * 80

    });

}


/* =========================================================
   UPDATE SHOOTING STARS
   ========================================================= */

function updateShootingStars(dt) {

    shootingStars =
        shootingStars.filter(
            star =>
                star.life <
                star.maxLife
        );


    shootingStars.forEach(
        star => {

            star.x +=
                star.vx * dt;

            star.y +=
                star.vy * dt;

            star.life +=
                dt * 60;

        }
    );

}


/* =========================================================
   DRAW SHOOTING STARS
   ========================================================= */

function drawShootingStars() {

    shootingStars.forEach(
        star => {

            const progress =
                star.life /
                star.maxLife;


            const fade =
                Math.sin(
                    Math.min(
                        progress,
                        1
                    ) * Math.PI
                );


            const tailX =
                star.x -
                star.vx *
                star.length /
                10;


            const tailY =
                star.y -
                star.vy *
                star.length /
                10;


            const gradient =
                ctx.createLinearGradient(
                    star.x,
                    star.y,
                    tailX,
                    tailY
                );


            gradient.addColorStop(
                0,
                `rgba(255,255,255,${fade})`
            );


            gradient.addColorStop(
                0.4,
                `rgba(130,210,255,${fade * 0.6})`
            );


            gradient.addColorStop(
                1,
                "rgba(130,210,255,0)"
            );


            ctx.strokeStyle =
                gradient;


            ctx.lineWidth = 2;


            ctx.lineCap =
                "round";


            ctx.beginPath();

            ctx.moveTo(
                star.x,
                star.y
            );

            ctx.lineTo(
                tailX,
                tailY
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.fillStyle =
                `rgba(255,255,255,${fade})`;

            ctx.arc(
                star.x,
                star.y,
                1.5,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );

}


/* =========================================================
   DRAW STARFIELD
   ========================================================= */

function drawStars(now, dt) {

    stars.forEach(
        star => {


            if (!reduceMotion) {

                star.y +=
                    star.speed *
                    dt;


                if (
                    star.y >
                    canvasHeight + 5
                ) {

                    star.y = -5;

                    star.x =
                        Math.random() *
                        canvasWidth;

                }

            }


            const twinkle =
                reduceMotion

                    ? 1

                    :

                    0.65 +
                    0.35 *
                    Math.sin(
                        now *
                        0.001 *
                        star.twinkleSpeed +
                        star.twinkle
                    );


            const x =
                star.x +
                targetX *
                star.parallax /
                100;


            const y =
                star.y +
                targetY *
                star.parallax /
                100;


            ctx.beginPath();


            ctx.fillStyle =
                `rgba(
                    255,
                    255,
                    255,
                    ${
                        (
                            star.alpha *
                            twinkle
                        ).toFixed(3)
                    }
                )`;


            ctx.arc(
                x,
                y,
                star.size,
                0,
                Math.PI * 2
            );


            ctx.fill();

        }
    );

}


/* =========================================================
   MAIN CANVAS LOOP
   ========================================================= */

function animateSpace(now) {

    const dt =
        Math.min(
            (now - lastTime) / 1000,
            0.05
        );


    lastTime =
        now;


    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    targetX +=
        (pointerX - targetX)
        * 0.04;


    targetY +=
        (pointerY - targetY)
        * 0.04;


    drawStars(
        now,
        dt
    );


    if (!reduceMotion) {

        updateShootingStars(dt);

        drawShootingStars();

    }


    requestAnimationFrame(
        animateSpace
    );

}


/* =========================================================
   POINTER PARALLAX
   ========================================================= */

window.addEventListener(
    "pointermove",
    event => {

        pointerX =
            (
                event.clientX /
                canvasWidth -
                0.5
            ) * 40;


        pointerY =
            (
                event.clientY /
                canvasHeight -
                0.5
            ) * 40;


        document.documentElement.style
            .setProperty(
                "--parallax-x",
                pointerX + "px"
            );


        document.documentElement.style
            .setProperty(
                "--parallax-y",
                pointerY + "px"
            );

    }
);


/* =========================================================
   SHOOTING STAR TIMER
   ========================================================= */

if (!reduceMotion) {

    setInterval(
        () => {

            createShootingStar();

        },
        4000
    );

}


/* =========================================================
   START CANVAS
   ========================================================= */

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();

requestAnimationFrame(
    animateSpace
);



/* =========================================================
   QUIZ DATABASE
   ========================================================= */

const questions = [

    /* =====================================================
       EARTH
       ===================================================== */

    {

        category: "EARTH",

        question:
            "Approximately how old is Earth?",

        options: [

            "1.2 billion years",

            "2.5 billion years",

            "4.54 billion years",

            "10 billion years"

        ],

        answer: 2,

        explanation:
            "Earth formed approximately 4.54 billion years ago."

    },


    {

        category: "EARTH",

        question:
            "Which gas makes up most of Earth's atmosphere?",

        options: [

            "Oxygen",

            "Carbon dioxide",

            "Nitrogen",

            "Hydrogen"

        ],

        answer: 2,

        explanation:
            "Nitrogen makes up approximately 78% of Earth's atmosphere."

    },


    {

        category: "EARTH",

        question:
            "What causes Earth's seasons?",

        options: [

            "Earth's distance from the Sun",

            "Earth's axial tilt",

            "The Moon",

            "Solar flares"

        ],

        answer: 1,

        explanation:
            "Earth's approximately 23.5-degree axial tilt produces the seasons."

    },


    {

        category: "EARTH",

        question:
            "Which layer contains most of Earth's ozone?",

        options: [

            "Troposphere",

            "Stratosphere",

            "Mesosphere",

            "Thermosphere"

        ],

        answer: 1,

        explanation:
            "Most atmospheric ozone is concentrated in the stratosphere."

    },


    /* =====================================================
       SOLAR SYSTEM
       ===================================================== */

    {

        category: "SOLAR SYSTEM",

        question:
            "Which is the largest planet in our Solar System?",

        options: [

            "Earth",

            "Saturn",

            "Jupiter",

            "Neptune"

        ],

        answer: 2,

        explanation:
            "Jupiter is the largest planet in our Solar System."

    },


    {

        category: "SOLAR SYSTEM",

        question:
            "Which planet is closest to the Sun?",

        options: [

            "Venus",

            "Earth",

            "Mercury",

            "Mars"

        ],

        answer: 2,

        explanation:
            "Mercury is the innermost planet in the Solar System."

    },


    {

        category: "SOLAR SYSTEM",

        question:
            "Which planet is famous for its spectacular rings?",

        options: [

            "Mars",

            "Saturn",

            "Venus",

            "Mercury"

        ],

        answer: 1,

        explanation:
            "Saturn has the most prominent ring system in our Solar System."

    },


    {

        category: "SOLAR SYSTEM",

        question:
            "What is the largest object in our Solar System?",

        options: [

            "Jupiter",

            "Earth",

            "The Sun",

            "Saturn"

        ],

        answer: 2,

        explanation:
            "The Sun is by far the largest object in our Solar System."

    },


    /* =====================================================
       SPACE
       ===================================================== */

    {

        category: "SPACE",

        question:
            "Which galaxy contains our Solar System?",

        options: [

            "Andromeda",

            "Whirlpool",

            "Milky Way",

            "Sombrero"

        ],

        answer: 2,

        explanation:
            "Our Solar System is located in the Milky Way galaxy."

    },


    {

        category: "SPACE",

        question:
            "What is a light-year?",

        options: [

            "A unit of time",

            "A unit of distance",

            "A type of star",

            "A space mission"

        ],

        answer: 1,

        explanation:
            "A light-year is a unit of distance: the distance light travels in one year."

    },


    {

        category: "SPACE",

        question:
            "What force keeps planets in orbit around the Sun?",

        options: [

            "Magnetism",

            "Friction",

            "Gravity",

            "Electricity"

        ],

        answer: 2,

        explanation:
            "The Sun's gravity keeps the planets in their orbital paths."

    },


    {

        category: "SPACE",

        question:
            "What is the nearest star to the Sun?",

        options: [

            "Sirius",

            "Proxima Centauri",

            "Vega",

            "Betelgeuse"

        ],

        answer: 1,

        explanation:
            "Proxima Centauri is the nearest known star to the Sun."

    },


    /* =====================================================
       BLACK HOLES
       ===================================================== */

    {

        category: "BLACK HOLES",

        question:
            "What is the boundary beyond which light cannot escape a black hole?",

        options: [

            "Photon sphere",

            "Event horizon",

            "Singularity",

            "Accretion disk"

        ],

        answer: 1,

        explanation:
            "The event horizon marks the boundary beyond which escape from a black hole is impossible."

    },


    {

        category: "BLACK HOLES",

        question:
            "What is a singularity in classical black-hole theory?",

        options: [

            "A planet",

            "A star",

            "A region where classical theory predicts extreme spacetime curvature",

            "A galaxy"

        ],

        answer: 2,

        explanation:
            "Classical general relativity predicts a singularity, though a complete theory of quantum gravity may modify this picture."

    },


    {

        category: "BLACK HOLES",

        question:
            "What happens to time near an extremely strong gravitational field?",

        options: [

            "Time can pass more slowly relative to a distant observer",

            "Time stops everywhere",

            "Time always speeds up",

            "Gravity has no effect on time"

        ],

        answer: 0,

        explanation:
            "General relativity predicts gravitational time dilation."

    },


    {

        category: "BLACK HOLES",

        question:
            "What is the glowing disk of hot material around some black holes called?",

        options: [

            "Photon cloud",

            "Accretion disk",

            "Solar ring",

            "Event disk"

        ],

        answer: 1,

        explanation:
            "An accretion disk consists of hot material spiraling around a compact object."

    },


    /* =====================================================
       INTERSTELLAR
       ===================================================== */

    {

        category: "INTERSTELLAR",

        question:
            "Who directed the movie Interstellar?",

        options: [

            "James Cameron",

            "Christopher Nolan",

            "Steven Spielberg",

            "Denis Villeneuve"

        ],

        answer: 1,

        explanation:
            "Interstellar was directed by Christopher Nolan and released in 2014."

    },


    {

        category: "INTERSTELLAR",

        question:
            "What is the name of the black hole in Interstellar?",

        options: [

            "Gargantua",

            "Sagittarius",

            "Nemesis",

            "Hyperion"

        ],

        answer: 0,

        explanation:
            "Gargantua is the massive rotating black hole featured in Interstellar."

    },


    {

        category: "INTERSTELLAR",

        question:
            "What was Cooper's profession before becoming a farmer?",

        options: [

            "Pilot and engineer",

            "Doctor",

            "Teacher",

            "Astronomer"

        ],

        answer: 0,

        explanation:
            "Cooper is a former NASA pilot and engineer before becoming a farmer."

    },


    {

        category: "INTERSTELLAR",

        question:
            "What causes the extreme time dilation on Miller's planet?",

        options: [

            "Its atmosphere",

            "Its proximity to Gargantua",

            "The Moon",

            "Solar radiation"

        ],

        answer: 1,

        explanation:
            "Miller's planet orbits very close to the massive black hole Gargantua, creating extreme gravitational time dilation."

    },


    {

        category: "INTERSTELLAR",

        question:
            "What is Cooper's daughter's name?",

        options: [

            "Amelia",

            "Murph",

            "Brand",

            "Doyle"

        ],

        answer: 1,

        explanation:
            "Murph, or Murphy Cooper, is Cooper's daughter and becomes central to the story."

    }

];



/* =========================================================
   GAME VARIABLES
   ========================================================= */

let playerName = "";

let currentQuestion = 0;

let score = 0;

let correctAnswers = 0;

let lives = 3;

let timeLeft = 15;

let timer = null;

let answered = false;



/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const startScreen =
    document.getElementById(
        "startScreen"
    );


const quizScreen =
    document.getElementById(
        "quizScreen"
    );


const resultScreen =
    document.getElementById(
        "resultScreen"
    );


const playerInput =
    document.getElementById(
        "playerName"
    );


const categoryElement =
    document.getElementById(
        "category"
    );


const questionNumberElement =
    document.getElementById(
        "questionNumber"
    );


const questionElement =
    document.getElementById(
        "question"
    );


const optionsElement =
    document.getElementById(
        "options"
    );


const scoreElement =
    document.getElementById(
        "score"
    );


const livesElement =
    document.getElementById(
        "lives"
    );


const timerElement =
    document.getElementById(
        "timer"
    );


const progressBar =
    document.getElementById(
        "progressBar"
    );


const explanationElement =
    document.getElementById(
        "explanation"
    );


const nextButton =
    document.getElementById(
        "nextButton"
    );


const ship =
    document.getElementById(
        "ship"
    );


const missionNumber =
    document.getElementById(
        "missionNo"
    );



/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    playerName =
        playerInput.value.trim();


    if (
        playerName === ""
    ) {

        playerName =
            "Captain";

    }


    currentQuestion = 0;

    score = 0;

    correctAnswers = 0;

    lives = 3;


    startScreen.classList.remove(
        "active"
    );


    quizScreen.classList.add(
        "active"
    );


    missionNumber.innerText =
        "01";


    loadQuestion();

}



/* =========================================================
   CHANGE SPACE ENVIRONMENT
   ========================================================= */

function changeSpaceEnvironment(
    category
) {

    document.body.classList.remove(

        "earth-mode",

        "solar-mode",

        "space-mode",

        "blackhole-mode",

        "interstellar-mode"

    );


    switch (category) {


        case "EARTH":

            document.body.classList.add(
                "earth-mode"
            );

            break;


        case "SOLAR SYSTEM":

            document.body.classList.add(
                "solar-mode"
            );

            break;


        case "SPACE":

            document.body.classList.add(
                "space-mode"
            );

            break;


        case "BLACK HOLES":

            document.body.classList.add(
                "blackhole-mode"
            );

            break;


        case "INTERSTELLAR":

            document.body.classList.add(
                "interstellar-mode"
            );

            break;

    }

}



/* =========================================================
   LOAD QUESTION
   ========================================================= */

function loadQuestion() {

    clearInterval(timer);


    answered = false;


    const q =
        questions[currentQuestion];


    changeSpaceEnvironment(
        q.category
    );


    categoryElement.innerText =
        q.category;


    questionNumberElement.innerText =

        "QUESTION " +

        String(
            currentQuestion + 1
        ).padStart(
            2,
            "0"
        );


    questionElement.innerText =
        q.question;


    scoreElement.innerText =
        score;


    livesElement.innerText =
        "❤️".repeat(lives);


    progressBar.style.width =

        (
            currentQuestion /
            questions.length
        ) *

        100 +

        "%";


    explanationElement.innerText =
        "";


    explanationElement.classList.remove(
        "show"
    );


    nextButton.classList.remove(
        "show"
    );


    nextButton.innerHTML =
        `
        NEXT MISSION
        <span>→</span>
        `;


    optionsElement.innerHTML =
        "";


    q.options.forEach(
        (option, index) => {


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "option";


            button.innerHTML =

                String.fromCharCode(
                    65 + index
                ) +

                ". " +

                option;


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        index,
                        button
                    );

                }
            );


            optionsElement.appendChild(
                button
            );

        }
    );


    startTimer();

}



/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

    timeLeft = 15;


    timerElement.innerText =
        timeLeft;


    timerElement.style.color =
        "var(--green)";


    timer = setInterval(
        () => {


            timeLeft--;


            timerElement.innerText =
                timeLeft;


            if (
                timeLeft <= 5
            ) {

                timerElement.style.color =
                    "var(--red)";

            }


            if (
                timeLeft <= 0
            ) {

                clearInterval(timer);

                timeUp();

            }

        },
        1000
    );

}



/* =========================================================
   SELECT ANSWER
   ========================================================= */

function selectAnswer(
    selectedIndex,
    selectedButton
) {


    if (answered) {

        return;

    }


    answered = true;


    clearInterval(timer);


    const q =
        questions[currentQuestion];


    const allOptions =
        document.querySelectorAll(
            ".option"
        );


    allOptions.forEach(
        button => {

            button.classList.add(
                "disabled"
            );

        }
    );


    if (
        selectedIndex ===
        q.answer
    ) {


        selectedButton.classList.add(
            "correct"
        );


        correctAnswers++;


        score +=
            100;


        score +=
            timeLeft * 5;


        explanationElement.innerText =

            "✓ CORRECT — " +
            q.explanation;


        explanationElement.classList.add(
            "show"
        );


        moveShip();

    }

    else {


        selectedButton.classList.add(
            "wrong"
        );


        allOptions[
            q.answer
        ].classList.add(
            "correct"
        );


        lives--;


        explanationElement.innerText =

            "✕ INCORRECT — " +
            q.explanation;


        explanationElement.classList.add(
            "show"
        );

    }


    updateStats();


    nextButton.classList.add(
        "show"
    );


    if (
        lives <= 0
    ) {

        nextButton.innerHTML =

            `
            VIEW MISSION REPORT
            <span>→</span>
            `;

    }

}



/* =========================================================
   TIME UP
   ========================================================= */

function timeUp() {


    if (answered) {

        return;

    }


    answered = true;


    lives--;


    const q =
        questions[currentQuestion];


    const allOptions =
        document.querySelectorAll(
            ".option"
        );


    allOptions.forEach(
        button => {

            button.classList.add(
                "disabled"
            );

        }
    );


    allOptions[
        q.answer
    ].classList.add(
        "correct"
    );


    explanationElement.innerText =

        "⏱ TIME UP — " +
        q.explanation;


    explanationElement.classList.add(
        "show"
    );


    updateStats();


    nextButton.classList.add(
        "show"
    );


    if (
        lives <= 0
    ) {

        nextButton.innerHTML =

            `
            VIEW MISSION REPORT
            <span>→</span>
            `;

    }

}



/* =========================================================
   UPDATE STATS
   ========================================================= */

function updateStats() {

    scoreElement.innerText =
        score;


    livesElement.innerText =
        "❤️".repeat(lives);

}



/* =========================================================
   MOVE SPACECRAFT
   ========================================================= */

function moveShip() {


    const percentage =

        12 +

        (
            (
                currentQuestion + 1
            ) /

            questions.length
        ) *

        72;


    ship.style.left =
        percentage + "%";

}



/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {


    if (
        lives <= 0
    ) {

        showResults();

        return;

    }


    currentQuestion++;


    if (
        currentQuestion >=
        questions.length
    ) {

        showResults();

        return;

    }


    missionNumber.innerText =

        String(
            currentQuestion + 1
        ).padStart(
            2,
            "0"
        );


    loadQuestion();

}



/* =========================================================
   SHOW RESULTS
   ========================================================= */

function showResults() {


    clearInterval(timer);


    quizScreen.classList.remove(
        "active"
    );


    resultScreen.classList.add(
        "active"
    );


    const accuracy =

        Math.round(

            (
                correctAnswers /
                questions.length
            ) * 100

        );


    document.getElementById(
        "finalName"
    ).innerText =
        playerName;


    document.getElementById(
        "finalScore"
    ).innerText =
        score;


    document.getElementById(
        "totalQuestions"
    ).innerText =
        questions.length;


    document.getElementById(
        "correctAnswers"
    ).innerText =
        correctAnswers;


    document.getElementById(
        "accuracy"
    ).innerText =
        accuracy + "%";


    let rank = "";

    let message = "";


    if (
        accuracy >= 90
    ) {


        rank =
            "🌌 MASTER OF THE UNIVERSE";


        message =

            "Outstanding, Captain. Your knowledge is strong enough to lead humanity into the unknown.";

    }

    else if (
        accuracy >= 75
    ) {


        rank =
            "🚀 SPACE COMMANDER";


        message =

            "Excellent performance. Your spacecraft is ready for deep-space exploration.";

    }

    else if (
        accuracy >= 50
    ) {


        rank =
            "🛰️ SPACE EXPLORER";


        message =

            "Good mission, Captain. There is still much more of the universe to discover.";

    }

    else {


        rank =
            "👨‍🚀 SPACE CADET";


        message =

            "Mission incomplete. Study the universe and return for another attempt.";

    }


    document.getElementById(
        "rank"
    ).innerText =
        rank;


    document.getElementById(
        "resultMessage"
    ).innerText =
        message;


    document.getElementById(
        "resultTitle"
    ).innerText =

        accuracy >= 50

            ? "MISSION COMPLETE"

            : "MISSION FAILED";

}



/* =========================================================
   RESTART
   ========================================================= */

function restartGame() {

    location.reload();

}



/* =========================================================
   ENTER KEY
   ========================================================= */

playerInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            startGame();

        }

    }
);