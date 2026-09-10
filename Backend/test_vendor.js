const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/vendor';

async function test() {
    console.log('--- Starting End-to-End Vendor Test ---');

    try {
        // 1. Health Check
        const health = await fetch('http://localhost:5000/health').then(res => res.json());
        console.log('Health Check:', health.success ? 'PASSED' : 'FAILED');

        // 2. Register
        const registerData = {
            fullName: 'Test Vendor',
            businessName: 'Test Business',
            email: `test_${Date.now()}@example.com`,
            phone: `9999${Math.floor(100000 + Math.random() * 900000)}`,
            city: 'Indore',
            category: 'Photographer',
            password: 'password123'
        };

        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        }).then(res => res.json());

        console.log('Registration:', regRes.success ? 'PASSED' : 'FAILED', regRes.message || '');

        if (!regRes.success) return;

        const token = regRes.token;

        // 3. Login
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registerData.email, password: registerData.password })
        }).then(res => res.json());

        console.log('Login:', loginRes.success ? 'PASSED' : 'FAILED');

        // 4. Update Onboarding (Business Step)
        const businessData = {
            description: 'Test Description',
            years: '5',
            teamSize: '10',
            languages: ['Hindi', 'English'],
            serviceCities: ['Indore']
        };

        const onboardRes = await fetch(`${BASE_URL}/onboarding/business`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(businessData)
        }).then(res => res.json());

        console.log('Onboarding Update (Business):', onboardRes.success ? 'PASSED' : 'FAILED');
        console.log('Next Recommended Step:', onboardRes.data?.onboardingStep);

        // 5. Get Profile
        const profileRes = await fetch(`${BASE_URL}/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json());

        console.log('Get Profile:', profileRes.success ? 'PASSED' : 'FAILED');

        console.log('--- Test Completed ---');
    } catch (error) {
        console.error('Test Failed with Error:', error);
    }
}

test();
