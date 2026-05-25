function app() {
    return {
        page: 'login',
        tab: 'standings',
        loading: false,
        error: '',
        credentials: {
            email: '',
            password: ''
        },
        standings: [],
        players: [],
        user: null,
        token: null,

        async init() {
            // Check if already logged in
            const token = localStorage.getItem('pb_token');
            const user = localStorage.getItem('pb_user');

            if (token && user) {
                this.token = token;
                this.user = JSON.parse(user);
                this.page = 'league';
                await this.loadLeagueData();
            }
        },

        async login() {
            this.loading = true;
            this.error = '';

            try {
                const res = await fetch('/api/collections/users/auth-with-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identity: this.credentials.email,
                        password: this.credentials.password
                    })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Login failed');
                }

                const data = await res.json();
                this.token = data.token;
                this.user = data.record;

                // Store in localStorage
                localStorage.setItem('pb_token', this.token);
                localStorage.setItem('pb_user', JSON.stringify(this.user));

                // Load league data and switch page
                this.page = 'league';
                await this.loadLeagueData();
            } catch (err) {
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        async loadLeagueData() {
            try {
                // Fetch all users (players)
                const usersRes = await fetch('/api/collections/users/records', {
                    headers: { 'Authorization': this.token }
                });
                const usersData = await usersRes.json();
                this.players = usersData.items || [];

                // Fetch match_points for standings
                const pointsRes = await fetch(
                    '/api/collections/match_points/records?perPage=500',
                    { headers: { 'Authorization': this.token } }
                );
                const pointsData = await pointsRes.json();

                // Build standings from match_points
                const playerMap = new Map();
                this.players.forEach(p => {
                    playerMap.set(p.id, {
                        id: p.id,
                        name: p.name || p.email,
                        email: p.email,
                        handicap: p.handicap || 0,
                        points: 0,
                        matchCount: 0
                    });
                });

                pointsData.items.forEach(mp => {
                    if (playerMap.has(mp.player)) {
                        playerMap.get(mp.player).points += mp.points;
                        playerMap.get(mp.player).matchCount += 1;
                    }
                });

                // Sort by points descending
                this.standings = Array.from(playerMap.values())
                    .sort((a, b) => b.points - a.points);
            } catch (err) {
                console.error('Failed to load league data:', err);
                this.error = 'Failed to load league data';
            }
        },

        logout() {
            localStorage.removeItem('pb_token');
            localStorage.removeItem('pb_user');
            this.token = null;
            this.user = null;
            this.page = 'login';
            this.credentials = { email: '', password: '' };
            this.error = '';
        }
    };
}
