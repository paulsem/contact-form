const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the form.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Proxy form submission to NiFi and redirect
app.post('/submitForm', async (req, res) => {
    const { name, email, originId } = req.body;

    try {
        // Forward the form data to NiFi
        const response = await axios.post(
            'http://localhost:9090/submitForm',
            new URLSearchParams({ name, email, originId }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, maxRedirects: 0 } // Disable auto-follow
        );

        res.send(response.data); // For non-redirect flows, send the NiFi response directly
    } catch (error) {
        if (error.response && error.response.status === 307) {
            console.log('Headers from NiFi:', error.response.headers);

            // Get the redirect URL from NiFi
            let redirectUrl = error.response.headers['http.headers.location'];

            if (redirectUrl) {
                redirectUrl = redirectUrl.trim();

                // Add protocol if missing
                if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
                    redirectUrl = `http://${redirectUrl}`;
                }

                console.log('Redirect URL:', redirectUrl);

                // Send the redirect URL to the client
                res.status(200).json({ redirectUrl });
            } else {
                console.error('Redirect URL is undefined. Headers:', error.response.headers);
                res.status(500).json({ message: 'Failed to retrieve redirect URL', headers: error.response.headers });
            }
        } else {
            console.error('Error forwarding to NiFi:', error.message);
            res.status(error.response?.status || 500).send('Failed to submit form data to NiFi');
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});