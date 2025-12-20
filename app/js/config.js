// Global variables
let filmData = [];
let processedData = null;
let selectedYear = new Date().getFullYear();
let selectedCharts = new Set(['releaseYear', 'releaseDecade', 'rating', 'timeline', 'controversy', 'genres', 'director', 'writer', 'directorDiscovery', 'monthlyViewing', 'dayOfWeek', 'seasonalPatterns', 'calendarHeatmap', 'bingePatterns', 'genrePersonality', 'runtimeAnalysis', 'workWeekSplit', 'tasteConsensus', 'directorLoyalty', 'nostalgiaProfile', 'releaseDelay', 'emotionalWhiplash', 'attentionSpan', 'recommendationAudit', 'trailerDeception']);

// TMDB API Configuration
// API key is now configured in secrets.js to avoid committing sensitive data to git
// IMPORTANT: When using TMDB data, proper attribution is required per their Terms of Use
// This app includes attribution in the footer - see index.html
//
// To set up your API key:
// 1. Copy secrets.js.example to secrets.js
// 2. Add your TMDB API key (get it from https://www.themoviedb.org/settings/api)
// 3. Add secrets.js to your .gitignore file

// Data validation constants
const RELEASE_YEAR_MIN = 1900;
const RELEASE_YEAR_MAX = 2030;
const RATING_MIN = 0.5;
const RATING_MAX = 5;
const RATING_STEP = 0.5;
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Available charts configuration - All 28 chart types from the plan
const availableCharts = [
    // Basic Analytics (1-4)
    {
        id: 'releaseYear',
        title: '📅 Release Year Distribution',
        description: 'See which years your favorite movies were released',
        category: 'Basic Analytics',
        enabled: true
    },
    {
        id: 'releaseDecade',
        title: '📅 Release Decade Distribution',
        description: 'Break down your watching by decades (80s, 90s, etc.)',
        category: 'Basic Analytics',
        enabled: true
    },
    {
        id: 'rating',
        title: '⭐ Rating Distribution',
        description: 'How you rate movies on a 1-5 star scale',
        category: 'Basic Analytics',
        enabled: true
    },
    {
        id: 'timeline',
        title: '📊 Watch Timeline',
        description: 'When you watched movies throughout the year',
        category: 'Basic Analytics',
        enabled: true
    },
    {
        id: 'controversy',
        title: '🤝 Controversy Analysis',
        description: 'Compare your ratings with community/critic consensus (Coming Soon)',
        category: 'Basic Analytics',
        enabled: true
    },
    {
        id: 'genres',
        title: '🎭 Genre Preferences',
        description: 'Which movie genres you watch most',
        category: 'Basic Analytics',
        enabled: true
    },

    // Director & Writer Analysis (5, 26)
    {
        id: 'director',
        title: '🎬 Director Analysis',
        description: 'Your favorite directors and their average ratings',
        category: 'Director Analysis',
        enabled: true
    },
    {
        id: 'writer',
        title: '✍️ Writer Analysis',
        description: 'Screenwriters who consistently deliver quality',
        category: 'Director Analysis',
        enabled: true
    },
    {
        id: 'directorDiscovery',
        title: '🔍 Director Discovery Timeline',
        description: 'When you first watched each director\'s work',
        category: 'Director Analysis',
        enabled: true
    },

    // Time-Based Patterns (6-10, 21-25)
    {
        id: 'monthlyViewing',
        title: '📈 Monthly Viewing Volume',
        description: 'Are you a binge watcher? See your monthly patterns',
        category: 'Time Patterns',
        enabled: true
    },
    {
        id: 'dayOfWeek',
        title: '📅 Day-of-Week Preferences',
        description: 'Weekend vs weekday viewing habits',
        category: 'Time Patterns',
        enabled: true
    },
    {
        id: 'seasonalPatterns',
        title: '🌸 Seasonal Viewing',
        description: 'More films in winter? Summer blockbusters?',
        category: 'Time Patterns',
        enabled: true
    },
    {
        id: 'calendarHeatmap',
        title: '📅 Calendar Heatmap',
        description: 'Interactive calendar showing viewing intensity by day',
        category: 'Time Patterns',
        enabled: true
    },
    {
        id: 'bingePatterns',
        title: '🎬 Binge Detection',
        description: 'Identify movie marathons and viewing streaks',
        category: 'Time Patterns',
        enabled: true
    },

    // Personality Insights (27)
    {
        id: 'genrePersonality',
        title: '🎭 Genre Personality Profile',
        description: 'What kind of movie person are you?',
        category: 'Personality Insights',
        enabled: true
    },
    {
        id: 'runtimeAnalysis',
        title: '⏱️ Runtime vs Rating Analysis',
        description: 'How long is too long for different genres?',
        category: 'Personality Insights',
        enabled: true
    },
    {
        id: 'workWeekSplit',
        title: '💼 Work Week vs Weekend Cinema',
        description: 'How your schedule affects movie choices',
        category: 'Personality Insights',
        enabled: true
    },
    {
        id: 'tasteConsensus',
        title: '🤝 Taste vs Critical Consensus',
        description: 'How much you agree with mainstream critics',
        category: 'Personality Insights',
        enabled: true
    },
    {
        id: 'directorLoyalty',
        title: '👑 Director Loyalty Index',
        description: 'Which directors you follow obsessively',
        category: 'Personality Insights',
        enabled: true
    },
    {
        id: 'nostalgiaProfile',
        title: '🕰️ Nostalgia vs Current Trends',
        description: 'Classic films vs new releases balance',
        category: 'Personality Insights',
        enabled: true
    },

    // Behavioral Quirks (28)
    {
        id: 'releaseDelay',
        title: '⏰ Release Delay Timeline',
        description: 'How long you wait to watch popular films',
        category: 'Behavioral Quirks',
        enabled: true
    },
    {
        id: 'emotionalWhiplash',
        title: '😵 Emotional Whiplash Index',
        description: 'How dramatically your movie moods change',
        category: 'Behavioral Quirks',
        enabled: true
    },
    {
        id: 'attentionSpan',
        title: '🧠 Attention Span Reality Check',
        description: 'Your tolerance for long movies at different times',
        category: 'Behavioral Quirks',
        enabled: true
    },
    {
        id: 'recommendationAudit',
        title: '💡 Recommendation Compliance',
        description: 'Which friends give the best movie advice',
        category: 'Behavioral Quirks',
        enabled: true
    },
    {
        id: 'trailerDeception',
        title: '🎥 Trailer Deception Detector',
        description: 'Movies that looked better/worse than trailers',
        category: 'Behavioral Quirks',
        enabled: true
    }
];

// Sample data for demo mode
const sampleData = {
    diary: `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2025-01-01,Companion,2025,https://boxd.it/8JCYWf,4,,,2025-02-04
2025-01-15,Mickey 17,2025,https://boxd.it/9paINj,3.5,,,2025-04-13
2025-02-01,Black Bag,2025,https://boxd.it/9g1JpN,3,,,2025-03-28
2025-02-15,Den of Thieves 2: Pantera,2025,https://boxd.it/9O8gIh,4,,,2025-05-25
2025-03-01,The Accountant²,2025,https://boxd.it/9OHhGV,2.5,,,2025-05-26
2025-03-15,Mission: Impossible – The Final Reckoning,2025,https://boxd.it/9Y1YmF,3,,,2025-06-10
2025-04-01,Mountainhead,2025,https://boxd.it/9ZbeST,2,,,2025-06-13
2025-04-15,The Ballad of Wallis Island,2025,https://boxd.it/a0qVJT,5,,,2025-06-14
2025-01-10,Oppenheimer,2023,https://boxd.it/sample2,5,,,2025-01-10
2025-01-20,Barbie,2023,https://boxd.it/sample3,4,,,2025-01-20
2025-02-05,Poor Things,2023,https://boxd.it/sample4,4,,,2025-02-05
2025-02-10,Dune: Part Two,2024,https://boxd.it/6OsYFx,4,,,2025-02-10
2025-02-20,Everything Everywhere All at Once,2022,https://boxd.it/jUk4,5,,,2025-02-20
2025-03-05,The Holdovers,2023,https://boxd.it/7wW4xD,4,,,2025-03-05
2025-03-10,Anatomy of a Fall,2023,https://boxd.it/7wW8Gp,3,,,2025-03-10
2025-03-20,The Substance,2024,https://boxd.it/sample,4,,,2025-03-20
2025-04-05,Challengers,2024,https://boxd.it/9xCMP7,4,Yes,,2025-04-05
2025-04-10,Inside Out,2015,https://boxd.it/6OsWnr,3,,,2025-04-10
2025-05-01,Spider-Man: Into the Spider-Verse,2018,https://boxd.it/6OsVn1,3,,,2025-05-01
2025-05-15,Mad Max: Fury Road,2015,https://boxd.it/6OsXlh,4,,,2025-05-15
2025-06-01,School of Rock,2003,https://boxd.it/6OsJJT,5,Yes,,,2025-06-01
2025-06-15,You've Got Mail,1998,https://boxd.it/6OsKVr,3,,,2025-06-15
2025-07-01,The Perks of Being a Wallflower,2012,https://boxd.it/6OsLV3,4,,,2025-07-01
2025-07-15,Zootopia,2016,https://boxd.it/84xS,3,,,2025-07-15
2025-08-01,10 Things I Hate About You,1999,https://boxd.it/23AO,4,,,2025-08-01`,
    reviews: `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date
2025-01-01,Companion,2025,https://boxd.it/8JCYWf,4,,AI companion romance with surprising depth and emotion,,2025-02-04
2025-01-15,Mickey 17,2025,https://boxd.it/9paINj,3.5,,Borghes' latest sci-fi adventure with great effects but uneven pacing,,2025-04-13
2025-02-01,Black Bag,2025,https://boxd.it/9g1JpN,3,,Political thriller that builds tension but feels familiar,,2025-03-28
2025-02-15,Den of Thieves 2: Pantera,2025,https://boxd.it/9O8gIh,4,,High-octane heist action that delivers on the promise,,2025-05-25
2025-03-01,The Accountant²,2025,https://boxd.it/9OHhGV,2,,Sequel doesn't quite match the original's charm,,2025-05-26
2025-03-15,Mission: Impossible – The Final Reckoning,2025,https://boxd.it/9Y1YmF,3,,Franchise finale with incredible action sequences,,2025-06-10
2025-04-01,Mountainhead,2025,https://boxd.it/9ZbeST,2,,Ambitious but confusing horror experiment,,2025-06-13
2025-04-15,The Ballad of Wallis Island,2025,https://boxd.it/a0qVJT,4.5,,Beautiful and haunting exploration of isolation,,2025-06-14
2025-02-20,Everything Everywhere All at Once,2022,https://boxd.it/jUk4,5,,Rewatch confirms it's a modern masterpiece,,2025-02-20
2025-06-01,School of Rock,2003,https://boxd.it/6OsJJT,5,Yes,"Jack Black's iconic performance holds up perfectly",,2025-06-01`
};
