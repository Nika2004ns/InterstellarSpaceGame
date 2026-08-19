/* =========================================================
           SOUND ENGINE (lightweight, no external assets, no autoplay)
           ========================================================= */
        const SoundEngine = (function () {
            let ctx = null;
            let enabled = localStorage.getItem('nikas_sound_enabled') === 'true';

            function getCtx() {
                if (!ctx) {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    if (AC) ctx = new AC();
                }
                if (ctx && ctx.state === 'suspended') ctx.resume();
                return ctx;
            }

            function tone(freq, duration, type = 'sine', gainPeak = 0.08, delay = 0) {
                if (!enabled) return;
                const audioCtx = getCtx();
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                const t0 = audioCtx.currentTime + delay;
                gain.gain.setValueAtTime(0, t0);
                gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(t0);
                osc.stop(t0 + duration + 0.05);
            }

            return {
                isEnabled: () => enabled,
                setEnabled(v) {
                    enabled = v;
                    localStorage.setItem('nikas_sound_enabled', v ? 'true' : 'false');
                    if (v) getCtx();
                },
                click() { tone(520, 0.08, 'sine', 0.05); },
                start() { tone(300, 0.18, 'triangle', 0.08); tone(600, 0.22, 'triangle', 0.06, 0.05); },
                correct() { tone(660, 0.12, 'sine', 0.09); tone(880, 0.18, 'sine', 0.08, 0.08); },
                wrong() { tone(220, 0.05, 'sawtooth', 0.08); tone(140, 0.25, 'sawtooth', 0.09, 0.06); },
                warning() { tone(880, 0.08, 'square', 0.04); },
                complete() { tone(440, 0.15, 'triangle', 0.08); tone(660, 0.15, 'triangle', 0.08, 0.12); tone(880, 0.3, 'triangle', 0.08, 0.24); }
            };
        })();

        /* =========================================================
           LOADING SCREEN
           ========================================================= */
        (function loader() {
            const bar = document.getElementById('loaderBar');
            const percent = document.getElementById('loaderPercent');
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 8) + 2;
                if (progress > 100) progress = 100;
                bar.style.width = progress + '%';
                percent.innerText = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        document.getElementById('loader').classList.add('hidden');
                        // init canvas after loader
                        if (typeof initCanvas === 'function') initCanvas();
                        // show mission ready
                    }, 400);
                }
            }, 120);
        })();

        /* =========================================================
           CANVAS STARFIELD (lightweight)
           ========================================================= */
        function initCanvas() {
            const canvas = document.getElementById('spaceCanvas');
            const ctx = canvas.getContext('2d');
            let w, h;
            const stars = [];
            const layers = [
                { count: 120, size: 0.8, speed: 0.3, alpha: 0.6 },
                { count: 80, size: 1.3, speed: 0.6, alpha: 0.8 },
                { count: 40, size: 2, speed: 1.0, alpha: 1 }
            ];
            function resize() {
                w = window.innerWidth; h = window.innerHeight;
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = w * dpr; canvas.height = h * dpr;
                canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
                ctx.setTransform(dpr,0,0,dpr,0,0);
                generateStars();
            }
            function generateStars() {
                stars.length = 0;
                layers.forEach((layer, li) => {
                    for (let i=0; i<layer.count; i++) {
                        stars.push({
                            x: Math.random() * w,
                            y: Math.random() * h,
                            size: layer.size * (0.6 + Math.random()*0.8),
                            alpha: layer.alpha * (0.5 + Math.random()*0.5),
                            speed: layer.speed * (0.7 + Math.random()*0.6),
                            twinkle: Math.random() * Math.PI * 2,
                            twSpeed: 0.3 + Math.random() * 0.8,
                            layer: li
                        });
                    }
                });
            }
            let pointerX = 0, pointerY = 0;
            let targetX = 0, targetY = 0;
            let lastTime = performance.now();

            function draw(now) {
                const dt = Math.min((now - lastTime)/1000, 0.05);
                lastTime = now;
                ctx.clearRect(0,0,w,h);
                targetX += (pointerX - targetX) * 0.04;
                targetY += (pointerY - targetY) * 0.04;
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                stars.forEach(star => {
                    if (!reduceMotion) {
                        star.y += star.speed * dt * 8;
                        if (star.y > h + 10) { star.y = -10; star.x = Math.random() * w; }
                    }
                    const tw = 0.6 + 0.4 * Math.sin(now * 0.001 * star.twSpeed + star.twinkle);
                    const px = star.x + targetX * (star.layer+1) * 0.08;
                    const py = star.y + targetY * (star.layer+1) * 0.08;
                    ctx.beginPath();
                    ctx.arc(px, py, star.size, 0, Math.PI*2);
                    ctx.fillStyle = `rgba(255,255,255,${star.alpha * tw * 0.7})`;
                    ctx.fill();
                });
                // shooting stars
                if (!reduceMotion && Math.random() < 0.002) {
                    const sx = Math.random() * w * 0.6;
                    const sy = Math.random() * h * 0.3;
                    const angle = Math.PI/4 + (Math.random()-0.5)*0.3;
                    const sp = 4 + Math.random()*4;
                    let life = 0, maxLife = 50 + Math.random()*30;
                    const vx = Math.cos(angle)*sp, vy = Math.sin(angle)*sp;
                    const interval = setInterval(() => {
                        life += 1;
                        if (life >= maxLife) { clearInterval(interval); return; }
                        const fade = Math.sin((life/maxLife)*Math.PI);
                        ctx.strokeStyle = `rgba(255,255,255,${fade*0.6})`;
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        const tx = sx + vx*life, ty = sy + vy*life;
                        ctx.moveTo(tx, ty);
                        ctx.lineTo(tx - vx*6, ty - vy*6);
                        ctx.stroke();
                    }, 30);
                }
                requestAnimationFrame(draw);
            }
            window.addEventListener('pointermove', e => {
                pointerX = (e.clientX / w - 0.5) * 30;
                pointerY = (e.clientY / h - 0.5) * 30;
            });
            window.addEventListener('resize', resize);
            resize();
            requestAnimationFrame(draw);
        }

        /* =========================================================
           QUIZ ENGINE (preserved & upgraded)
           ========================================================= */
        const questions = [
            { category: "EARTH", question: "Approximately how old is Earth?", options: ["1.2 billion years","2.5 billion years","4.54 billion years","10 billion years"], answer: 2, explanation: "Earth formed approximately 4.54 billion years ago." },
            { category: "EARTH", question: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"], answer: 2, explanation: "Nitrogen makes up approximately 78% of Earth's atmosphere." },
            { category: "EARTH", question: "What causes Earth's seasons?", options: ["Earth's distance from the Sun","Earth's axial tilt","The Moon","Solar flares"], answer: 1, explanation: "Earth's approximately 23.5-degree axial tilt produces the seasons." },
            { category: "EARTH", question: "Which layer contains most of Earth's ozone?", options: ["Troposphere","Stratosphere","Mesosphere","Thermosphere"], answer: 1, explanation: "Most atmospheric ozone is concentrated in the stratosphere." },
            { category: "SOLAR SYSTEM", question: "Which is the largest planet in our Solar System?", options: ["Earth","Saturn","Jupiter","Neptune"], answer: 2, explanation: "Jupiter is the largest planet in our Solar System." },
            { category: "SOLAR SYSTEM", question: "Which planet is closest to the Sun?", options: ["Venus","Earth","Mercury","Mars"], answer: 2, explanation: "Mercury is the innermost planet in the Solar System." },
            { category: "SOLAR SYSTEM", question: "Which planet is famous for its spectacular rings?", options: ["Mars","Saturn","Venus","Mercury"], answer: 1, explanation: "Saturn has the most prominent ring system in our Solar System." },
            { category: "SOLAR SYSTEM", question: "What is the largest object in our Solar System?", options: ["Jupiter","Earth","The Sun","Saturn"], answer: 2, explanation: "The Sun is by far the largest object in our Solar System." },
            { category: "SPACE", question: "Which galaxy contains our Solar System?", options: ["Andromeda","Whirlpool","Milky Way","Sombrero"], answer: 2, explanation: "Our Solar System is located in the Milky Way galaxy." },
            { category: "SPACE", question: "What is a light-year?", options: ["A unit of time","A unit of distance","A type of star","A space mission"], answer: 1, explanation: "A light-year is a unit of distance: the distance light travels in one year." },
            { category: "SPACE", question: "What force keeps planets in orbit around the Sun?", options: ["Magnetism","Friction","Gravity","Electricity"], answer: 2, explanation: "The Sun's gravity keeps the planets in their orbital paths." },
            { category: "SPACE", question: "What is the nearest star to the Sun?", options: ["Sirius","Proxima Centauri","Vega","Betelgeuse"], answer: 1, explanation: "Proxima Centauri is the nearest known star to the Sun." },
            { category: "BLACK HOLES", question: "What is the boundary beyond which light cannot escape a black hole?", options: ["Photon sphere","Event horizon","Singularity","Accretion disk"], answer: 1, explanation: "The event horizon marks the boundary beyond which escape from a black hole is impossible." },
            { category: "BLACK HOLES", question: "What is a singularity in classical black-hole theory?", options: ["A planet","A star","A region where classical theory predicts extreme spacetime curvature","A galaxy"], answer: 2, explanation: "Classical general relativity predicts a singularity, though a complete theory of quantum gravity may modify this picture." },
            { category: "BLACK HOLES", question: "What happens to time near an extremely strong gravitational field?", options: ["Time can pass more slowly relative to a distant observer","Time stops everywhere","Time always speeds up","Gravity has no effect on time"], answer: 0, explanation: "General relativity predicts gravitational time dilation." },
            { category: "BLACK HOLES", question: "What is the glowing disk of hot material around some black holes called?", options: ["Photon cloud","Accretion disk","Solar ring","Event disk"], answer: 1, explanation: "An accretion disk consists of hot material spiraling around a compact object." },
            { category: "INTERSTELLAR", question: "Who directed the movie Interstellar?", options: ["James Cameron","Christopher Nolan","Steven Spielberg","Denis Villeneuve"], answer: 1, explanation: "Interstellar was directed by Christopher Nolan and released in 2014." },
            { category: "INTERSTELLAR", question: "What is the name of the black hole in Interstellar?", options: ["Gargantua","Sagittarius","Nemesis","Hyperion"], answer: 0, explanation: "Gargantua is the massive rotating black hole featured in Interstellar." },
            { category: "INTERSTELLAR", question: "What was Cooper's profession before becoming a farmer?", options: ["Pilot and engineer","Doctor","Teacher","Astronomer"], answer: 0, explanation: "Cooper is a former NASA pilot and engineer before becoming a farmer." },
            { category: "INTERSTELLAR", question: "What causes the extreme time dilation on Miller's planet?", options: ["Its atmosphere","Its proximity to Gargantua","The Moon","Solar radiation"], answer: 1, explanation: "Miller's planet orbits very close to the massive black hole Gargantua, creating extreme gravitational time dilation." },
            { category: "INTERSTELLAR", question: "What is Cooper's daughter's name?", options: ["Amelia","Murph","Brand","Doyle"], answer: 1, explanation: "Murph, or Murphy Cooper, is Cooper's daughter and becomes central to the story." }
        ];

        // DOM refs
        const startScreen = document.getElementById('startScreen');
        const quizScreen = document.getElementById('quizScreen');
        const resultScreen = document.getElementById('resultScreen');
        const playerNameInput = document.getElementById('playerName');
        const startBtn = document.getElementById('startGameBtn');
        const beginMissionBtn = document.getElementById('beginMissionBtn');
        const categoryDisplay = document.getElementById('categoryDisplay');
        const missionNoDisplay = document.getElementById('missionNoDisplay');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const livesDisplay = document.getElementById('livesDisplay');
        const timerText = document.getElementById('timerText');
        const timerRing = document.getElementById('timerRing');
        const explanationBox = document.getElementById('explanationBox');
        const nextBtn = document.getElementById('nextBtn');
        const finalName = document.getElementById('finalName');
        const finalScore = document.getElementById('finalScore');
        const finalCorrect = document.getElementById('finalCorrect');
        const finalRank = document.getElementById('finalRank');
        const resultMessage = document.getElementById('resultMessage');
        const resultTitle = document.getElementById('resultTitle');
        const accuracyPercent = document.getElementById('accuracyPercent');
        const accuracyArc = document.getElementById('accuracyArc');
        const restartBtn = document.getElementById('restartBtn');

        // Game state
        let currentQ = 0, score = 0, correctAnswers = 0, lives = 3;
        let timeLeft = 15, timerInterval = null, answered = false;
        let playerName = 'Captain';

        function updateUI() {
            scoreDisplay.textContent = score;
            livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));
            if (timerInterval) {
                timerText.textContent = timeLeft;
                const circumference = 125.6;
                const offset = circumference - (timeLeft / 15) * circumference;
                timerRing.style.strokeDasharray = circumference;
                timerRing.style.strokeDashoffset = offset;
                if (timeLeft <= 5) timerRing.style.stroke = 'var(--red)';
                else timerRing.style.stroke = 'var(--green)';
            }
        }

        function loadQuestion() {
            clearInterval(timerInterval);
            answered = false;
            const q = questions[currentQ];
            categoryDisplay.textContent = q.category;
            missionNoDisplay.textContent = `MISSION ${String(currentQ+1).padStart(2,'0')}`;
            questionText.textContent = q.question;
            optionsContainer.innerHTML = '';
            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = `<span class="letter">${String.fromCharCode(65+idx)}.</span> ${opt}`;
                btn.dataset.idx = idx;
                btn.addEventListener('click', () => handleAnswer(idx, btn));
                optionsContainer.appendChild(btn);
            });
            explanationBox.classList.remove('show');
            explanationBox.textContent = '';
            nextBtn.classList.remove('show');
            // timer
            timeLeft = 15;
            timerText.textContent = timeLeft;
            timerRing.style.stroke = 'var(--green)';
            const circumference = 125.6;
            timerRing.style.strokeDasharray = circumference;
            timerRing.style.strokeDashoffset = 0;
            updateUI();
            timerInterval = setInterval(() => {
                timeLeft--;
                timerText.textContent = timeLeft;
                const offset = circumference - (timeLeft / 15) * circumference;
                timerRing.style.strokeDashoffset = offset;
                if (timeLeft <= 5) timerRing.style.stroke = 'var(--red)';
                if (timeLeft <= 5 && timeLeft > 0) SoundEngine.warning();
                if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeUp(); }
                updateUI();
            }, 1000);
        }

        function handleAnswer(idx, btn) {
            if (answered) return;
            answered = true;
            clearInterval(timerInterval);
            const q = questions[currentQ];
            const allBtns = document.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.classList.add('disabled'));
            if (idx === q.answer) {
                btn.classList.add('correct');
                correctAnswers++;
                score += 100 + timeLeft * 5;
                explanationBox.textContent = `✓ CORRECT — ${q.explanation}`;
                explanationBox.classList.add('show');
                SoundEngine.correct();
            } else {
                btn.classList.add('wrong');
                allBtns[q.answer].classList.add('correct');
                lives--;
                explanationBox.textContent = `✕ INCORRECT — ${q.explanation}`;
                explanationBox.classList.add('show');
                SoundEngine.wrong();
            }
            updateUI();
            if (lives <= 0) {
                nextBtn.textContent = 'VIEW MISSION REPORT →';
            } else {
                nextBtn.textContent = 'NEXT MISSION →';
            }
            nextBtn.classList.add('show');
        }

        function handleTimeUp() {
            if (answered) return;
            answered = true;
            const q = questions[currentQ];
            const allBtns = document.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.classList.add('disabled'));
            allBtns[q.answer].classList.add('correct');
            lives--;
            explanationBox.textContent = `⏱ TIME UP — ${q.explanation}`;
            explanationBox.classList.add('show');
            SoundEngine.wrong();
            updateUI();
            if (lives <= 0) {
                nextBtn.textContent = 'VIEW MISSION REPORT →';
            } else {
                nextBtn.textContent = 'NEXT MISSION →';
            }
            nextBtn.classList.add('show');
        }

        function nextQuestion() {
            if (lives <= 0 || currentQ >= questions.length-1) {
                showResults();
                return;
            }
            currentQ++;
            loadQuestion();
        }

        function showResults() {
            clearInterval(timerInterval);
            quizScreen.classList.add('hidden');
            resultScreen.classList.remove('hidden');
            const accuracy = Math.round((correctAnswers / questions.length) * 100);
            finalName.textContent = playerName;
            finalScore.textContent = score;
            finalCorrect.textContent = `${correctAnswers}/${questions.length}`;
            let rank, msg;
            if (accuracy >= 90) { rank = 'MASTER OF THE UNIVERSE'; msg = 'Outstanding, Captain. Your knowledge is strong enough to lead humanity into the unknown.'; }
            else if (accuracy >= 75) { rank = 'SPACE COMMANDER'; msg = 'Excellent performance. Your spacecraft is ready for deep-space exploration.'; }
            else if (accuracy >= 50) { rank = 'SPACE EXPLORER'; msg = 'Good mission, Captain. There is still much more of the universe to discover.'; }
            else { rank = 'SPACE CADET'; msg = 'Mission incomplete. Study the universe and return for another attempt.'; }
            finalRank.textContent = rank;
            resultMessage.textContent = msg;
            resultTitle.textContent = accuracy >= 50 ? 'MISSION COMPLETE' : 'MISSION FAILED';
            accuracyPercent.textContent = accuracy + '%';
            const arcLength = 282.7;
            const offset = arcLength - (accuracy / 100) * arcLength;
            accuracyArc.style.strokeDasharray = arcLength;
            accuracyArc.style.strokeDashoffset = offset;
            SoundEngine.complete();
            // save to localStorage leaderboard
            saveScore(playerName, score, accuracy, rank);
            saveProfile(playerName, score, accuracy, rank);
        }

        /* =========================================================
           CAPTAIN PROFILE (localStorage) — section 15
           ========================================================= */
        const RANK_ORDER = ['SPACE CADET', 'SPACE EXPLORER', 'SPACE COMMANDER', 'MASTER OF THE UNIVERSE'];
        function loadProfile() {
            try {
                return JSON.parse(localStorage.getItem('nikas_profile') || 'null');
            } catch (e) { return null; }
        }
        function saveProfile(name, sc, acc, rank) {
            try {
                const existing = loadProfile() || { name, bestScore: 0, bestAccuracy: 0, missionsPlayed: 0, highestRank: '' };
                existing.name = name;
                existing.bestScore = Math.max(existing.bestScore, sc);
                existing.bestAccuracy = Math.max(existing.bestAccuracy, acc);
                existing.missionsPlayed = (existing.missionsPlayed || 0) + 1;
                const prevIdx = RANK_ORDER.indexOf(existing.highestRank);
                const newIdx = RANK_ORDER.indexOf(rank);
                if (newIdx > prevIdx) existing.highestRank = rank;
                localStorage.setItem('nikas_profile', JSON.stringify(existing));
                renderProfile();
            } catch (e) {}
        }
        function renderProfile() {
            const profile = loadProfile();
            const box = document.getElementById('profileStats');
            if (!box) return;
            if (!profile) { box.classList.add('hidden'); return; }
            box.classList.remove('hidden');
            document.getElementById('profBestScore').textContent = profile.bestScore;
            document.getElementById('profBestAcc').textContent = profile.bestAccuracy + '%';
            document.getElementById('profMissions').textContent = profile.missionsPlayed;
            document.getElementById('profRank').textContent = profile.highestRank || '—';
            if (profile.name && playerNameInput && !playerNameInput.value) {
                playerNameInput.value = profile.name;
            }
        }

        function saveScore(name, sc, acc, rank) {
            try {
                let board = JSON.parse(localStorage.getItem('interstellar_leaderboard') || '[]');
                board.push({ name, score: sc, accuracy: acc, rank, date: new Date().toISOString() });
                board.sort((a,b) => b.score - a.score);
                if (board.length > 20) board = board.slice(0,20);
                localStorage.setItem('interstellar_leaderboard', JSON.stringify(board));
                updateLeaderboard();
            } catch(e) {}
        }

        function updateLeaderboard() {
            try {
                const board = JSON.parse(localStorage.getItem('interstellar_leaderboard') || '[]');
                const list = document.getElementById('leaderboardList');
                if (!list) return;
                list.innerHTML = board.slice(0,5).map((e,i) =>
                    `<div>${String(i+1).padStart(2,'0')}  ${e.name.toUpperCase().padEnd(12)} ${e.score}</div>`
                ).join('');
            } catch(e) {}
        }

        function startGame() {
            playerName = playerNameInput.value.trim() || 'Captain';
            currentQ = 0; score = 0; correctAnswers = 0; lives = 3;
            startScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            resultScreen.classList.add('hidden');
            loadQuestion();
            updateUI();
            // update mission map
            updateMap(0);
        }

        function restartGame() {
            startScreen.classList.remove('hidden');
            quizScreen.classList.add('hidden');
            resultScreen.classList.add('hidden');
            score = 0; correctAnswers = 0; lives = 3;
            updateUI();
        }

        // Mission map
        const mapNodes = ['EARTH','MOON','SOLAR SYSTEM','DEEP SPACE','BLACK HOLE','WORMHOLE','INTERSTELLAR'];
        function updateMap(activeIdx) {
            const container = document.getElementById('mapContainer');
            container.innerHTML = '';
            mapNodes.forEach((node, i) => {
                const div = document.createElement('div');
                div.className = 'map-node';
                if (i === activeIdx) div.classList.add('active');
                else if (i < activeIdx) div.classList.add('completed');
                div.innerHTML = `<div class="dot"></div><span>${node}</span>`;
                container.appendChild(div);
                if (i < mapNodes.length-1) {
                    const line = document.createElement('span');
                    line.className = 'map-line';
                    line.textContent = '●';
                    container.appendChild(line);
                }
            });
        }

        // Event listeners
        startBtn.addEventListener('click', () => { SoundEngine.start(); startGame(); });
        beginMissionBtn.addEventListener('click', () => {
            SoundEngine.click();
            document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
            setTimeout(startGame, 400);
        });
        nextBtn.addEventListener('click', () => { SoundEngine.click(); nextQuestion(); });
        restartBtn.addEventListener('click', () => { SoundEngine.click(); restartGame(); });
        playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

        // Sound toggle — section 16 (never autoplays; only responds to a user gesture)
        const soundToggleBtn = document.getElementById('soundToggle');
        function refreshSoundToggleUI() {
            const on = SoundEngine.isEnabled();
            soundToggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            soundToggleBtn.querySelector('.sound-icon').textContent = on ? '🔊' : '🔇';
        }
        soundToggleBtn.addEventListener('click', () => {
            SoundEngine.setEnabled(!SoundEngine.isEnabled());
            refreshSoundToggleUI();
            SoundEngine.click();
        });
        refreshSoundToggleUI();

        // Hamburger
        document.getElementById('hamburger').addEventListener('click', () => {
            document.getElementById('navLinks').classList.toggle('open');
            document.getElementById('hamburger').classList.toggle('open');
        });

        // Nav links smooth scroll
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                SoundEngine.click();
                document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
                const target = link.dataset.section;
                const el = document.getElementById(target) || document.getElementById('hero');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('navLinks').classList.remove('open');
                document.getElementById('hamburger').classList.remove('open');
            });
        });

        // Reel & science cards — lightweight interactivity (keyboard accessible)
        document.querySelectorAll('.reel-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            const title = card.querySelector('.reel-info h4');
            if (title) card.setAttribute('aria-label', `Play reel: ${title.textContent}`);
            const activate = () => {
                SoundEngine.click();
                card.classList.add('active');
                setTimeout(() => card.classList.remove('active'), 600);
            };
            card.addEventListener('click', activate);
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
        });
        document.querySelectorAll('.science-card .btn-explore').forEach(btn => {
            btn.addEventListener('click', () => {
                SoundEngine.click();
                document.getElementById('quizSection').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Init map, leaderboard & profile
        updateMap(0);
        updateLeaderboard();
        renderProfile();

        // Expose initCanvas for loader
        window.initCanvas = initCanvas;
        // If loader already hidden (fast), init canvas
        if (document.getElementById('loader').classList.contains('hidden')) {
            initCanvas();
        }