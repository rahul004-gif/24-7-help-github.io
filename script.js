const statusDiv = document.getElementById('status');

// Generic function to send data to the server
async function sendData(event, url, userId, passId) {
    event.preventDefault();
    
    const user = document.getElementById(userId).value;
    const pass = document.getElementById(passId).value;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const result = await response.text();
        statusDiv.innerText = result;
    } catch (error) {
        statusDiv.innerText = "Error connecting to server";
    }
}

// Attach the functions to your forms
document.getElementById('regForm').addEventListener('submit', (e) => sendData(e, '/register', 'rUser', 'rPass'));
document.getElementById('logForm').addEventListener('submit', (e) => sendData(e, '/login', 'lUser', 'lPass'));