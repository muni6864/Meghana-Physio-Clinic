const express = require('express');

const sqlite3 = require('sqlite3').verbose();

const app = express();

const PORT = 3000;

// 1. MIDDLEWARE SETUP

app.use(express.urlencoded({ extended: true })); 

app.use(express.static('public')); 

// 2. DATABASE SETUP

const db = new sqlite3.Database('./clinic.db', (err) => {

    if (err) console.error(err.message);

    console.log('Connected to the SQLite database.');

});

db.serialize(() => {

    // Create Doctor Table

    db.run(`CREATE TABLE IF NOT EXISTS doctor (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT,

        qualification TEXT,

        image_url TEXT,

        phone TEXT

    )`);

    // Create Feedback Table

    db.run(`CREATE TABLE IF NOT EXISTS feedbacks (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        patient_name TEXT,

        mobile TEXT,

        details TEXT,

        rating INTEGER

    )`);

    // Insert Dr. Meghana P PT (Seed Data)

    db.get("SELECT * FROM doctor WHERE name = 'Dr. Meghana P PT'", (err, row) => {

        if (!row) {

            const stmt = db.prepare("INSERT INTO doctor (name, qualification, image_url, phone) VALUES (?, ?, ?, ?)");

            stmt.run('Dr. Meghana P PT', 'Bachelor of Physiotherapy', '/doctor.jpg', '9019996573'); 

            stmt.finalize();

        }

    });

});

// 3. ROUTES

app.get('/', (req, res) => {

    db.get("SELECT * FROM doctor LIMIT 1", (err, doctor) => {

        if (err) return res.send("Database error");

        db.all("SELECT * FROM feedbacks ORDER BY id DESC", (err, feedbacks) => {

            if (err) return res.send("Database error");

            db.get("SELECT AVG(rating) as avg_rating, COUNT(id) as count FROM feedbacks", (err, stats) => {

                if (err) return res.send("Database error");

                res.send(renderHTML(doctor, feedbacks, stats));

            });

        });

    });

});

app.post('/submit-feedback', (req, res) => {

    const { name, mobile, details, rating } = req.body;

    const stmt = db.prepare("INSERT INTO feedbacks (patient_name, mobile, details, rating) VALUES (?, ?, ?, ?)");

    stmt.run(name, mobile, details, rating, (err) => {

        if (err) return res.send("Error saving feedback");

        res.redirect('/');

    });

    stmt.finalize();

});

// 4. FRONTEND TEMPLATE

function renderHTML(doctor, feedbacks, stats) {

    const STAR_FULL = '\u2605';  

    const STAR_EMPTY = '\u2606'; 

    const PHONE_ICON = '\u260E'; 

    const PLAY_ICON = '\u25B6'; 

    const ARROW_ICON = '\u2192'; 

    const getStars = (count) => STAR_FULL.repeat(count) + STAR_EMPTY.repeat(5 - count);

    const avgRating = stats.avg_rating ? stats.avg_rating.toFixed(1) : "0.0"; 

    const totalReviews = stats.count || 0;

    const avgDisplay = `${STAR_FULL} ${avgRating}/5 (${totalReviews} Reviews)`;

    const feedbackListHtml = feedbacks.map(f => `
<div class="feedback-card">
<div class="feedback-header">
<div class="user-avatar">${f.patient_name.charAt(0).toUpperCase()}</div>
<div>
<strong style="display:block; color:#333;">${f.patient_name}</strong>
<span class="stars">${getStars(f.rating)}</span>
</div>
</div>
<p>"${f.details}"</p>
</div>

    `).join('');

    const docName = doctor ? doctor.name : "Dr. Meghana P PT";

    const docQual = doctor ? doctor.qualification : "Specialist";

    const docImg = (doctor && doctor.image_url) ? doctor.image_url : "/doctor.jpg";

    const docPhone = doctor ? doctor.phone : "9019996573";

    const whatsAppLink = `https://wa.me/91${docPhone}`;

    const callLink = `tel:+91${docPhone}`;

    const servicesContent = `
<div class="service-card">
<h3>Ultrasound</h3>
<p>Deep heat therapy for pain reduction and rapid healing.</p>
</div>
<div class="service-card">
<h3>IFT Therapy</h3>
<p>Interferential currents to relieve inflammation.</p>
</div>
<div class="service-card">
<h3>TENS</h3>
<p>Nerve stimulation to block pain signals effectively.</p>
</div>
<div class="service-card">
<h3>Back Pain</h3>
<p>Core strengthening and posture correction exercises.</p>
</div>
<div class="service-card">
<h3>Neck Pain</h3>
<p>Manual therapy to improve mobility and reduce stiffness.</p>
</div>
<div class="service-card">
<h3>Knee Pain</h3>
<p>Stability training for quads and hamstrings.</p>
</div>

    `;

    // Header Background Image

    const headerBgImage = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1350&q=80";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Meghana Physio Clinic</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>

            :root { 

                --primary: #0066cc; 

                --primary-dark: #004c99;

                --secondary: #10b981;

                --bg-body: #f3f6f9;

                --white: #ffffff; 

                --text-main: #1f2937;

                --text-light: #6b7280;

                --card-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);

                --radius: 24px;

            }

            body { 

                font-family: 'Poppins', sans-serif; 

                margin: 0; 

                background: var(--bg-body); 

                color: var(--text-main); 

            }

            /* HEADER */

            .header-section { 

                background: linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.9)), url('${headerBgImage}');

                background-size: cover;

                background-position: center;

                background-attachment: fixed; 

                text-align: center; 

                padding: 80px 20px; 

                color: var(--white);

                border-radius: 0 0 40px 40px;

                margin-bottom: -40px; /* Overlap effect */

                position: relative;

                z-index: 1;

            }

            .main-title { 

                margin: 0; 

                font-size: 3.5rem; 

                font-weight: 700; 

                background: linear-gradient(to right, #fff, #cbd5e1);

                -webkit-background-clip: text;

                -webkit-text-fill-color: transparent;

                text-shadow: 0 4px 12px rgba(0,0,0,0.3);

            }

            .sub-title { color: #e2e8f0; font-size: 1.25rem; margin-top: 15px; font-weight: 300; }

            /* LAYOUT */

            .container { 

                display: grid; 

                grid-template-columns: 380px 1fr; 

                gap: 40px; 

                max-width: 1280px; 

                margin: 0 auto 60px auto; 

                padding: 0 30px; 

                position: relative;

                z-index: 2;

            }

            /* MAIN CONTENT ADJUSTMENT - FIXED VISIBILITY */

            .main-content {

                margin-top: 60px; /* Pushes content down to clear the dark header */

            }

            /* CARDS */

            .card { 

                background: var(--white); 

                padding: 35px; 

                border-radius: var(--radius); 

                box-shadow: var(--card-shadow); 

                border: 1px solid rgba(255,255,255,0.8);

            }

            /* PROFILE CARD */

            .profile-card { text-align: center; position: sticky; top: 30px; }

            .profile-img { 

                width: 160px; height: 160px; object-fit: cover; 

                border-radius: 40px; border: 6px solid var(--white); 

                box-shadow: 0 10px 25px rgba(0,0,0,0.1); 

                margin-bottom: 20px; transform: translateY(-50px); margin-top: -15px; 

            }

            .profile-name { font-size: 2rem; color: var(--text-main); margin: -30px 0 5px 0; }

            .profile-qual { color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 15px; }

            .profile-expertise { background: #eff6ff; color: var(--primary); font-weight: 600; font-size: 0.9rem; padding: 8px 16px; border-radius: 100px; display: inline-block; margin-bottom: 15px; }

            .rating-badge { display: inline-flex; align-items: center; gap: 5px; background: #fffbeb; border: 1px solid #fcd34d; padding: 8px 16px; border-radius: 12px; color: #b45309; font-weight: 700; margin-bottom: 20px; }

            .contact-row { display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--text-light); font-weight: 500; margin-bottom: 25px; }

            /* BUTTONS */

            .btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }

            .btn { padding: 16px; border: none; border-radius: 16px; color: white; cursor: pointer; text-decoration: none; font-weight: 600; font-size: 1rem; text-align: center; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }

            .call { background: var(--secondary); }

            .msg { background: #25D366; }

            .btn:hover { transform: translateY(-3px); }

            /* VIDEO SECTION */

            .video-section h3 { text-align: left; font-size: 1.1rem; margin-bottom: 15px; }

            .video-btn { display: flex; align-items: center; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 12px; border-radius: 16px; cursor: pointer; transition: 0.3s; text-align: left; }

            .video-btn:hover { background: white; border-color: var(--primary); transform: translateX(5px); }

            .vid-thumb { width: 70px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 15px; }

            .vid-info { flex: 1; }

            .vid-title { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }

            .play-indicator { width: 30px; height: 30px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 10px; }

            /* SERVICES */

            .services-container { margin-bottom: 40px; }

            /* FIXED SECTION HEADER STYLE */

            .section-header { 

                font-size: 1.5rem; 

                font-weight: 700; 

                margin-bottom: 20px; 

                display: flex; 

                align-items: center; 

                gap: 10px;

                color: var(--text-main); /* Ensure dark color */

                background: rgba(255,255,255,0.8); /* Slight background for readability */

                padding: 10px 15px;

                border-radius: 12px;

                backdrop-filter: blur(5px);

                width: fit-content;

            }

            .section-header::before { content: ''; width: 6px; height: 25px; background: var(--primary); border-radius: 4px; display: block; }

            .services-wrapper { background: white; padding: 40px 0; border-radius: var(--radius); box-shadow: var(--card-shadow); overflow: hidden; }

            .scroll-track { display: flex; width: max-content; animation: scroll 40s linear infinite; }

            .scroll-track:hover { animation-play-state: paused; }

            @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

            .service-card { width: 280px; background: #f8fafc; padding: 25px; margin: 0 20px; border-radius: 20px; flex-shrink: 0; border: 1px solid #f1f5f9; }

            .icon-box { font-size: 2rem; margin-bottom: 10px; }

            .service-card h3 { color: var(--text-main); margin: 0 0 10px 0; font-size: 1.1rem; }

            /* FORM */

            .form-section { margin-bottom: 40px; }

            .input-group { margin-bottom: 20px; }

            .input-group label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main); }

            input, textarea, select { width: 100%; padding: 16px; border: 2px solid #f1f5f9; border-radius: 16px; background: #f8fafc; font-family: inherit; font-size: 1rem; box-sizing: border-box; transition: 0.3s; }

            input:focus, textarea:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1); }

            button[type="submit"] { 

                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); 

                color: white; border: none; padding: 18px 30px; border-radius: 100px; width: 100%; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; 

                box-shadow: 0 10px 20px rgba(0, 102, 204, 0.3); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 10px; 

                display: flex; justify-content: space-between; align-items: center; padding-left: 40px; padding-right: 40px; 

            }

            button[type="submit"]:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0, 102, 204, 0.4); }

            button[type="submit"]::after { content: '${ARROW_ICON}'; font-size: 1.4rem; transition: transform 0.3s; }

            button[type="submit"]:hover::after { transform: translateX(5px); }

            /* REVIEWS */

            .reviews-section { max-height: 600px; overflow-y: auto; padding-right: 10px; }

            .feedback-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

            .feedback-card { background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; }

            .feedback-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }

            .user-avatar { width: 45px; height: 45px; background: #bfdbfe; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; }

            .stars { color: #f59e0b; letter-spacing: 2px; font-size: 0.9rem; }

            /* MODAL */

            .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(5px); }

            .modal-content { position: relative; width: 90%; max-width: 450px; background: #000; border-radius: 20px; overflow: hidden; }

            .close-modal-btn { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; cursor: pointer; z-index: 10; transition: 0.2s; }

            .close-modal-btn:hover { background: rgba(220, 38, 38, 0.8); }

            iframe { width: 100%; height: 80vh; border: none; display: block; }

            @media (max-width: 900px) { 

                .container { grid-template-columns: 1fr; } 

                .header-section { padding: 60px 20px; }

                .main-title { font-size: 2.2rem; }

                .profile-img { width: 140px; height: 140px; }

                .profile-card { position: static; }

                .main-content { margin-top: 30px; }

            }
</style>
</head>
<body>
<div class="header-section">
<h1 class="main-title">Meghana Physio Clinic</h1>
<div class="sub-title">Advanced Physiotherapy & Rehabilitation Center</div>
</div>
<div class="container">
<div class="left-column">
<div class="card profile-card">
<img src="${docImg}" alt="Dr. ${docName}" class="profile-img" onerror="this.src=''; this.style.backgroundColor='#e0e0e0';">
<h2 class="profile-name">${docName}</h2>
<div class="profile-qual">${docQual}</div>
<div class="profile-expertise">Field of expertise: TKR Management</div>
<div class="rating-badge">${avgDisplay}</div>
<div class="contact-row"><span>${PHONE_ICON} +91 ${docPhone}</span></div>
<div class="btn-group">
<a href="${callLink}" class="btn call">Call Now</a>
<a href="${whatsAppLink}" target="_blank" class="btn msg">WhatsApp</a>
</div>
<div class="video-section">
<h3>Exercise Library</h3>
<button class="video-btn" onclick="openVideo('https://www.youtube.com/embed/ze3H9ZaGFVE')">
<img src="https://img.youtube.com/vi/ze3H9ZaGFVE/0.jpg" class="vid-thumb">
<div class="vid-info"><span class="vid-title">General Physiotherapy</span></div>
<div class="play-indicator">${PLAY_ICON}</div>
</button>
<button class="video-btn" onclick="openVideo('https://www.youtube.com/embed/LpRnOEdygFc')">
<img src="https://img.youtube.com/vi/LpRnOEdygFc/0.jpg" class="vid-thumb">
<div class="vid-info"><span class="vid-title">Lower Back Pain</span></div>
<div class="play-indicator">${PLAY_ICON}</div>
</button>
<button class="video-btn" onclick="openVideo('https://www.youtube.com/embed/dHk-RqehNc8')">
<img src="https://img.youtube.com/vi/dHk-RqehNc8/0.jpg" class="vid-thumb">
<div class="vid-info"><span class="vid-title">Neck Pain Relief</span></div>
<div class="play-indicator">${PLAY_ICON}</div>
</button>
<button class="video-btn" onclick="openVideo('https://www.youtube.com/embed/8euXMuNLRS4')">
<img src="https://img.youtube.com/vi/8euXMuNLRS4/0.jpg" class="vid-thumb">
<div class="vid-info"><span class="vid-title">Knee Pain Exercise</span></div>
<div class="play-indicator">${PLAY_ICON}</div>
</button>
</div>
</div>
</div>
<div class="main-content">
<div class="services-container">
<div class="section-header">Our Specialized Services</div>
<div class="services-wrapper">
<div class="scroll-track">

                        ${servicesContent}

                        ${servicesContent}
</div>
</div>
<div class="card reviews-section">
<div class="section-header">Patient Reviews</div>
<div class="feedback-grid">

                    ${feedbackListHtml.length > 0 ? feedbackListHtml : '<p style="color:#777; font-style:italic; text-align:center;">No reviews yet. Be the first to share your experience!</p>'}
</div>
</div>
<div class="card form-section">
<div class="section-header">Submit Your Feedback</div>
<form action="/submit-feedback" method="POST">
<div class="input-group">
<label>Patient Name <span style="color:red">*</span></label> 
<input type="text" name="name" required placeholder="Enter full name">
</div>
<div class="input-group">
<label>Mobile Number <span style="color:red">*</span></label> 
<input type="tel" name="mobile" pattern="[0-9]{10}" required placeholder="10-digit mobile number" title="Please enter exactly 10 digits">
</div>
<div class="input-group">
<label>Rate Your Experience <span style="color:red">*</span></label>
<select name="rating" required>
<option value="" disabled selected>Select a rating</option>
<option value="5">${STAR_FULL}${STAR_FULL}${STAR_FULL}${STAR_FULL}${STAR_FULL} (Excellent)</option>
<option value="4">${STAR_FULL}${STAR_FULL}${STAR_FULL}${STAR_FULL}${STAR_EMPTY} (Good)</option>
<option value="3">${STAR_FULL}${STAR_FULL}${STAR_FULL}${STAR_EMPTY}${STAR_EMPTY} (Average)</option>
<option value="2">${STAR_FULL}${STAR_FULL}${STAR_EMPTY}${STAR_EMPTY}${STAR_EMPTY} (Poor)</option>
<option value="1">${STAR_FULL}${STAR_EMPTY}${STAR_EMPTY}${STAR_EMPTY}${STAR_EMPTY} (Bad)</option>
</select>
</div>
<div class="input-group">
<label>Feedback Details <span style="color:red">*</span></label> 
<textarea name="details" rows="3" required placeholder="Tell us about your treatment experience..."></textarea>
</div>
<button type="submit">SUBMIT</button>
</form>
</div>
</div>
</div>
</div>
<div id="videoModal" class="modal-overlay">
<div class="modal-content">
<div class="close-modal-btn" onclick="closeVideo()">&times;</div>
<iframe id="videoPlayer" src="" allowfullscreen></iframe>
</div>
</div>
<script>

        const modal = document.getElementById('videoModal');

        const player = document.getElementById('videoPlayer');

        function openVideo(url) {

            player.src = url + "?autoplay=1"; 

            modal.style.display = "flex";

        }

        function closeVideo() {

            modal.style.display = "none";

            player.src = "";

        }

        window.onclick = function(event) {

            if (event.target == modal) {

                closeVideo();

            }

        }
</script>
</body>
</html>

    `;

}

app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});
 