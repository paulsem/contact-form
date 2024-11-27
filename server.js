const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the HTML form for GET requests to "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Handle POST requests
app.post('/', async (req, res) => {
    const { name, email, originId } = req.body;

    try {
        console.log('Received form data:', { name, email, originId });

        // Send the form data to the NiFi endpoint
        const response = await axios.post(
            'http://localhost:9090?tenantId=tenant1',
            new URLSearchParams({ name, email, originId }).toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxRedirects: 0, // Prevent Axios from following the redirect automatically
                validateStatus: (status) => status === 307, // Only handle status code 307
            }
        );

        // Extract the redirect URL from the 'http.headers.location' header
        const redirectUrl = response.headers['http.headers.location'];

        if (redirectUrl) {
            console.log('Redirect URL:', redirectUrl);
            res.status(200).json({ redirectUrl }); // Send the redirect URL as a JSON response
        } else {
            console.error('Redirect URL not found in the response.');
            res.status(500).json({ message: 'Redirect URL not found.' });
        }
    } catch (error) {
        console.error('Error occurred:', error.message);

        if (error.response) {
            console.error('Error response from NiFi:', error.response.data);
            res.status(error.response.status).json({ message: error.response.statusText });
        } else {
            console.error('Unexpected error:', error);
            res.status(500).json({ message: 'Unexpected error occurred.' });
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});