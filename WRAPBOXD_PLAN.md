# Wrapboxd - Letterboxd Annual Wrap Project Plan

## Project Overview
Build a web application that generates personalized movie analytics for Letterboxd users, focusing on their yearly viewing habits, ratings distribution, and rating patterns compared to community averages.

**Primary Approach: CSV Upload**
- Users export their complete Letterboxd history as CSV files
- All processing happens locally in the browser (no data sent to servers)
- TMDB API integration for movie metadata and community ratings
- Generate comprehensive charts and insights about viewing patterns

## Core Features
- CSV upload with optional TMDB metadata enhancement
- Interactive charts and visualizations
- Year-over-year movie release analysis
- Rating distribution analysis
- Controversy analysis (personal vs. community ratings)

---

## Technical Implementation Plan

### Data Acquisition Strategy

**Note:** Letterboxd's official API is not available for personal data-analysis projects. Our primary approach is CSV upload with TMDB enrichment.

#### Primary Approach: CSV Upload (Letterboxd Export) - **MAIN FOCUS**
**Pros:**
- Most reliable and ethical approach
- User controls their own data
- No external dependencies or rate limits
- Works completely offline
- Official Letterboxd-recommended method

**Cons:**
- Requires manual user action (export from Letterboxd)
- Limited to user's own data only

**Implementation:**
- PapaParse for robust CSV processing
- Support for Letterboxd's export format
- Local file processing (no data sent to servers)

**Process:**
1. User exports their data from Letterboxd Settings → Import & Export
2. Uploads the ZIP file containing CSV data
3. App processes locally in browser

#### Movie Metadata: TMDB API Integration
**Purpose:** Get film details, posters, cast, crew, and community ratings

**Pros:**
- Rich movie metadata
- High-quality posters and images
- Community ratings for controversy analysis
- Free API tier available

**Implementation:**
```javascript
// TMDB API integration for movie metadata
const tmdbClient = {
  searchMovie: (title, year) => fetch(`https://api.themoviedb.org/3/search/movie?query=${title}&year=${year}`),
  getMovieDetails: (tmdbId) => fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`),
  getMovieCredits: (tmdbId) => fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits`)
}
```

---

## Client-Side Architecture & Security

### Privacy-First Design
- **Zero Backend**: Everything runs in the browser
- **No Data Transmission**: Files never leave user's computer
- **No User Accounts**: No authentication or data storage on servers
- **Self-Contained**: Works offline after initial load

### ZIP Security Measures
- **File Size Limit**: Maximum 50MB upload (reasonable for Letterboxd exports)
- **File Type Validation**: Strict .zip MIME type checking
- **Content Whitelisting**: Only extract known filenames:
  - `diary.csv`, `reviews.csv`, `watched.csv`, `ratings.csv`
  - `profile.csv`, `watchlist.csv`
- **Safe Extraction**: JSZip library handles decompression safely
- **Memory Limits**: Stream processing prevents memory exhaustion

### Development Approach: Keep It Simple

#### File Structure
```
wrapboxd/
├── index.html          # Single HTML file with everything
├── WRAPBOXD_PLAN.md    # This plan
├── README.md          # Basic usage instructions
└── example/           # Sample Letterboxd data
    ├── letterboxd-choicehoney-2025-12-20-17-50-utc.zip
    ├── diary.csv       # Main watch history
    ├── reviews.csv     # Detailed reviews
    ├── ratings.csv     # All ratings
    ├── watched.csv     # Complete history
    └── ...             # Other CSV files
```

#### Development Workflow
1. **Edit index.html directly** - No build tools needed
2. **Test in browser** - Just open the HTML file
3. **Debug with console.log** - Simple debugging approach
4. **Iterate quickly** - Make changes and refresh

#### Data Processing Pipeline
1. **Upload**: User drags ZIP file to browser
2. **Validation**: Check file size (< 50MB) and type (.zip)
3. **Extraction**: JSZip extracts only whitelisted CSV files
4. **Parsing**: PapaParse converts CSV to JavaScript arrays
5. **Processing**: Transform data, calculate statistics
6. **Display**: Generate D3.js charts and statistics

### Tech Stack: Simple Vanilla JavaScript

#### No Build Tools, No Frameworks
- **Plain HTML/CSS/JavaScript**: No React, no TypeScript, no build steps
- **CDN Libraries**: Direct script tags for external libraries
- **Single HTML File**: Everything in one self-contained file
- **No Package Manager**: Manual dependency management

#### Core Libraries (CDN)
```html
<!-- ZIP handling -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<!-- CSV parsing -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

<!-- Data visualization -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Simple UI (optional) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

#### Architecture: 100% Client-Side
- **Zero Dependencies on Build Tools**: Just open index.html in browser
- **No Backend Required**: Everything runs locally
- **No Data Transmission**: Files never leave user's computer
- **Privacy-First**: All processing happens in browser

#### Security Measures
- **File Size Limits**: Max 50MB upload to prevent zip bombs
- **File Type Validation**: Only .zip files accepted
- **Content Whitelisting**: Only extract known CSV filenames
- **No File Execution**: Extracted content treated as data only
- **Memory Management**: Stream processing for large files

---

## Data Model & Structure

### Core Data Entities

#### User Film Entry (Based on CSV Structure)
```typescript
interface FilmEntry {
  // CSV fields from diary.csv/reviews.csv
  diaryDate: Date;        // "Date" - when added to diary
  title: string;          // "Name" - film title
  releaseYear: number;    // "Year" - film release year
  letterboxdUri: string;  // "Letterboxd URI" - film page link
  rating?: number;        // "Rating" - 1-5 scale (not 0.5 increments)
  rewatch: boolean;       // "Rewatch" - true if "Yes"
  tags?: string;          // "Tags" - comma-separated user tags
  watchedDate?: Date;     // "Watched Date" - when actually watched
  review?: string;        // "Review" - from reviews.csv

  // Derived/enhanced fields
  id?: string;            // Generated unique ID
  normalizedRating?: number; // Rating converted to 0-10 scale for TMDB comparison
  daysBetweenWatchAndDiary?: number; // Time gap analysis
}
```

#### Film Metadata (From TMDB)
```typescript
interface Film {
  // Letterboxd data
  letterboxdId?: string;
  letterboxdUrl?: string;

  // TMDB data
  tmdbId: number;
  title: string;
  originalTitle?: string;
  year: number;
  releaseDate: string;
  genres: Genre[];
  directors: Person[];
  cast: Person[];
  averageRating: number; // TMDB community rating (0-10 scale)
  voteCount: number;
  runtime: number;
  countries: string[];
  languages: string[];
  posterPath?: string;
  backdropPath?: string;
  overview: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
}

interface Genre {
  id: number;
  name: string;
}

interface Person {
  id: number;
  name: string;
  character?: string; // For cast members
  job?: string; // For crew (director, writer, etc.)
  profilePath?: string;
}
```

#### User Profile
```typescript
interface User {
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  stats: {
    filmsWatched: number;
    hoursWatched: number;
    averageRating: number;
  };
}
```

### CSV Structure Analysis (COMPLETED ✅)
Analyzed the actual Letterboxd export structure:

#### CSV Files Discovered
- **`diary.csv`** (34KB) - **PRIMARY DATA SOURCE**: Watch history with ratings, dates, rewatches, tags
- **`reviews.csv`** (90KB) - Detailed reviews with text, ratings, and metadata
- **`watched.csv`** (40KB) - Complete watch history (no ratings)
- **`ratings.csv`** (26KB) - All rated films with ratings only
- **`watchlist.csv`** (20KB) - Films marked to watch
- **`profile.csv`** - User profile and rating scale information

#### Actual Data Structures

**diary.csv** - Most important for our analytics:
```csv
Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2024-07-06,NYAD,2023,https://boxd.it/6OsUPt,3,,,2024-02-05
2024-07-06,Inside Out,2015,https://boxd.it/6OsWnr,3,,,2024-02-11
```

**reviews.csv** - Includes review text:
```csv
Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date
2024-07-06,School of Rock,2003,https://boxd.it/6OsJJT,5,Yes,"it holds up, rip freddie",,2024-06-14
```

#### Key Insights
- **Rating Scale**: 1-5 (not 0.5 increments as initially assumed)
- **Release Year**: Available in "Year" column for every film
- **Watch Date**: "Watched Date" field shows when film was actually viewed
- **Diary Date**: "Date" field shows when added to diary (may differ from watch date)
- **Rewatch**: "Yes" for rewatches, empty otherwise
- **Tags**: User-defined tags (often empty)
- **Review Text**: Available in reviews.csv for films with written reviews

#### Data Quality Notes
- **Complete Coverage**: diary.csv has ratings for rated films
- **Date Formats**: Standard YYYY-MM-DD format
- **Missing Data**: Some films lack ratings, tags, or reviews
- **Rich Context**: reviews.csv provides additional qualitative data

---

## Chart & Visualization Ideas

### 1. Release Year Distribution
**Chart Types:**
- Histogram/bar chart showing movies by decade
- Line chart showing release years over time (scatter plot)
- Heatmap calendar showing watch dates vs release years

**Insights:**
- What eras do you prefer? (80s nostalgia, modern films, classics)
- Are you watching more recent releases or catching up on older films?
- Decade breakdown with percentages

### 2. Rating Distribution Analysis
**Chart Types:**
- Histogram of ratings (0.5-5.0 stars)
- Box plot showing rating quartiles
- Pie chart of rating categories (Hated, Disliked, Neutral, Liked, Loved)

**Insights:**
- Are you a harsh critic or generous rater?
- Rating patterns (tendency toward whole numbers vs half-stars)
- Comparison to community averages

### 3. Controversy Analysis (Personal vs Community Ratings)
**Chart Types:**
- Scatter plot: Your rating vs Average rating
- Bar chart: Films with biggest rating differences
- Heatmap: Rating difference by genre/year

**Insights:**
- Films you loved that others hated (underrated gems)
- Films you hated that others loved (overrated disappointments)
- Genre-specific rating differences (e.g., harsher on comedies?)

### Additional Chart Ideas

#### 4. Genre Analysis
- Treemap showing time spent by genre
- Radar chart comparing genre preferences
- Sankey diagram showing genre evolution over months

#### 5. Director & Writer Deep Dives
**Director Analysis:**
- Top directors by films watched and average ratings
- Director rating consistency (how reliably you enjoy their work)
- Director discovery timeline (when you first watched each director)
- Underrated directors (high personal rating, low community awareness)
- Director career progression (how your opinion of them changed over time)
- Director collaboration networks (shared actors, writers, cinematographers)

**Writer/Screenwriter Analysis:**
- Top writers by films watched and ratings
- Writer consistency analysis (reliability of quality)
- Screenwriter discovery patterns
- Writer-director partnerships you enjoy most
- Adaptation analysis (books vs screenplays)
- Writer evolution tracking (style changes over career)

**Cross-Analysis:**
- Director-writer combinations that work best for you
- Consistency comparison (directors vs writers)
- Hidden gems (talent you love that others haven't discovered)
- Career trajectory insights (rising stars vs established favorites)

#### 6. Temporal Patterns
- Monthly viewing volume (are you a binge watcher?)
- Day-of-week preferences
- Seasonal patterns (more films in winter?)

#### 7. Runtime Analysis
- Distribution of film lengths
- Runtime preferences by genre
- Total watch time calculations

#### 8. Rewatch Analysis
- Percentage of rewatches
- Rewatch frequency by rating/year
- "Desert island" films (most rewatched)

#### 9. Tag/Mood Analysis
- Most used tags
- Tag co-occurrence analysis
- Mood tracking over time

#### 10. Comparative Analytics
- Year-over-year comparisons
- Personal benchmarks vs goals
- Streaks and milestones

### 11. Watch Timing & Binge Patterns
**Chart Types:**
- Calendar heatmap showing watch intensity by day
- Time-of-day histogram (morning, afternoon, evening, night preferences)
- Weekday vs weekend viewing comparison
- Gap analysis scatter plot (days between watches to detect binge patterns)
- Streak analysis (consecutive days with watches)

**Insights:**
- Are you a night owl or morning movie watcher?
- Weekend binge-watching habits vs weekday casual viewing
- Longest gaps between watches (busy periods vs movie droughts)
- Consistency of viewing schedule over time

### 12. Rating Evolution & Consistency
**Chart Types:**
- Rating timeline with trend lines (showing rating drift over time)
- Rating consistency radar chart (consistency by genre/director/year)
- Rating revision analysis (films re-rated after rewatches)
- Rating volatility heatmap (how much ratings vary by time of year)
- Box plot showing rating distributions by year/decade

**Insights:**
- Do your tastes change over time? (getting more/less critical)
- Which genres do you rate most consistently?
- Fresh vs retrospective ratings (do rewatches change opinions?)
- Seasonal rating patterns (harsher in winter?)

### 13. Actor & Cast Analysis
**Chart Types:**
- Most-watched actors bubble chart (size = number of films)
- Actor rating averages bar chart (your favorites vs community)
- Actor-director collaboration network graph
- Cast diversity analysis (gender, ethnicity breakdowns)
- Actor discovery timeline (when you first watched their films)

**Insights:**
- Your "go-to" actors for reliable entertainment
- Underrated actors you consistently enjoy
- Actor-director partnerships you follow most
- New actor discoveries over time

### 14. Franchise & Series Analysis
**Chart Types:**
- Franchise network graph (connecting sequels, prequels, spin-offs)
- Series completion rates (watched vs total in franchise)
- Franchise rating progression line charts
- Universe timeline (Marvel, Star Wars, etc. watch chronology)
- Franchise loyalty analysis (percentage of films watched per franchise)

**Insights:**
- Are you a completionist? (finish entire franchises)
- Which franchises do you follow religiously?
- Do franchise films get better/worse as they progress?
- Your cinematic universes (Marvel vs Star Wars vs DC)

### 15. Review & Content Analysis
**Chart Types:**
- Review length vs rating scatter plot
- Tag co-occurrence matrix/heatmap
- Sentiment analysis timeline (if review text analysis is possible)
- Review density calendar (days with written reviews)
- Tag relationship network graph

**Insights:**
- Do you write longer reviews for films you love/hate?
- Which tags tend to appear together? (mood + genre combinations)
- Your most prolific reviewing periods
- Tag evolution over time (changing descriptive vocabulary)

### 16. International & Cultural Patterns
**Chart Types:**
- World map showing film origins (choropleth)
- Language preference bar chart
- Country production analysis treemap
- International rating comparisons (how you rate different cinemas)
- Subtitled vs dubbed preferences

**Insights:**
- Your geographic cinematic preferences (Hollywood vs international)
- Language comfort zones vs exploration
- Cultural discovery patterns over time
- Rating biases toward certain national cinemas

### 17. Advanced Network Analysis
**Chart Types:**
- Director-actor collaboration chord diagram
- Genre transition sankey diagram (how tastes evolve)
- Tag relationship force-directed graph
- Film similarity network (based on shared actors/directors/genres)
- Recommendation network (films watched due to other films)

**Insights:**
- Hidden connections in your viewing history
- How one film leads to another in your journey
- Collaborative patterns between directors and actors
- Your "gateway" films that opened new genres

### 18. Predictive & Trend Analysis
**Chart Types:**
- Rating prediction accuracy (your ratings vs TMDB predictions)
- Trend extrapolation (projecting future viewing patterns)
- Seasonal forecasting (predicting busy/quiet movie months)
- Rating confidence intervals (uncertainty in your ratings)
- Pattern recognition (identifying your "type" of viewer)

**Insights:**
- How predictable are your own ratings?
- Emerging trends in your viewing habits
- Confidence in your movie opinions
- What kind of movie viewer profile you fit

### 19. Comparative & Social Analysis
**Chart Types:**
- Year-over-year comparison bump charts
- Personal vs community rating difference distributions
- Viewing pace comparison (your speed vs averages)
- Social influence tracking (films watched due to recommendations)
- Milestone celebration charts (100th film, etc.)

**Insights:**
- How your habits change year to year
- Where you differ most from general audiences
- Social vs solitary viewing patterns
- Personal achievement tracking

### 20. Interactive Discovery Tools
**Chart Types:**
- Dynamic filtering dashboard (multi-dimensional exploration)
- Film recommendation engine visualization
- "What to watch next" suggestion networks
- Mood-based film selector interface
- Custom time period analysis tools

**Insights:**
- Self-directed exploration of your data
- Pattern discovery through interaction
- Personalized recommendations based on history
- Flexible analysis of different time periods

### 21. Spotify-Inspired Features (Personalized Insights)
**Chart Types:**
- "Movie Personality/Aura" radar chart (based on genre preferences and ratings)
- Total watch time counter with fun comparisons (equivalent to X movie marathons)
- Music-to-Movie crossover analysis (if music data available)
- Nostalgic time capsule (films from your past that you rewatched)
- Personalized movie horoscope/predictions for next year
- Achievement badges (100 films, 5-star streak, genre completionist)

**Insights:**
- Your cinematic personality profile
- Total time investment in movies vs other activities
- Nostalgic rediscoveries and rewatches
- Gamified achievements and milestones

### 22. YouTube-Inspired Features (Watch Time & Discovery)
**Chart Types:**
- Total watch time dashboard with category breakdowns
- "Ad-free equivalent" time earned through watching
- Channel-like analysis (studios as "channels" you subscribe to)
- Video completion rates (watched full movie vs dropped)
- Discovery journey maps (how you found new films)
- Subscription patterns (consistent studios vs one-off watches)

**Insights:**
- Time commitment to cinema vs other entertainment
- Completion rates and attention spans
- Discovery patterns and recommendation effectiveness
- Brand loyalty to specific studios/distributors

### 23. Personalized Messages & Milestones
**Chart Types:**
- AI-generated personalized movie insights
- Milestone celebration cards (100th film, 10-year anniversary)
- Director/artist "messages" (top director would say...)
- Fun trivia about your watching habits
- Year-over-year comparison narratives
- Predictive insights ("You'll probably watch...")

**Insights:**
- Humanized, story-driven insights
- Achievement recognition and motivation
- Predictive recommendations based on patterns
- Narrative framing of your movie journey

### 24. Shareable Highlights & Social Features
**Chart Types:**
- Instagram-worthy stat cards (clean, shareable visualizations)
- "Proudest film discoveries" highlight reel
- Controversy showcase (biggest rating disagreements)
- Achievement badges and certificates
- "Movie DNA" fingerprint visualization
- Social comparison prompts (vs friends' habits)

**Insights:**
- Share-worthy moments from your movie year
- Social validation of tastes and discoveries
- Visual storytelling for your movie identity
- Community connection opportunities

### 25. Advanced Time-Based Analytics
**Chart Types:**
- Listening-equivalent analysis (if you tracked music while watching)
- Seasonal movie mood analysis (holiday films, summer blockbusters)
- Decade-by-decade taste evolution timeline
- "Movie time capsule" predictions (films you'll love in 2034)
- Binge-watching pattern detection
- Sleep vs movie time correlation (if bedtime data available)

**Insights:**
- Multi-modal entertainment patterns
- Seasonal and cyclical preferences
- Long-term taste evolution prediction
- Healthy balance indicators (work vs entertainment)

### 26. Director & Writer Discovery Engine
**Chart Types:**
- Director/writer "taste fingerprint" (consistency and preference analysis)
- Hidden gem discovery (talent you love that critics haven't noticed)
- Career progression timelines (how your opinion of directors/writers evolved)
- Collaboration constellation maps (director-writer-actor relationships)
- Writer-director partnership success rates
- "Blind spot" identification (genres you like but haven't explored deeply)
- Recommendation engine based on director/writer patterns

**Insights:**
- "Oh, I really like this director/writer!" discoveries
- Consistent creative voices you've gravitated toward
- Underrated talent you championed early
- Creative partnerships that consistently deliver for you
- Blind spots in your exploration of filmmaking talent
- Predictive recommendations based on director/writer DNA

### 27. "What Kind of Movie Person Am I?" Personality Insights
**Chart Types:**

**1. Genre Personality Profile**
- Treemap or stacked bar showing genre distribution
- Percentage breakdowns with personality labels
- Avoids boring pie charts for modern, engaging visualization

**Insights:**
- "Apparently I'm 42% existential dread" personality reveals
- Genre DNA that defines your movie personality
- Unexpected genre combinations that make you unique

**2. Runtime vs Rating Risk Assessment**
- Scatter plot (runtime on x-axis, your rating on y-axis)
- Color-coded by genre for pattern recognition
- Trend lines showing your tolerance for long films

**Insights:**
- "Proof that 3-hour movies are a gamble for me"
- Which genres justify long runtimes in your eyes
- Your patience threshold for cinematic commitment

**3. Seasonal Cinema Rhythm**
- Line or area chart showing movies per month
- Year-over-year comparison overlays
- Peak and valley analysis with personal context

**Insights:**
- "Why did I watch 14 movies in February?" seasonal mysteries
- "December: zero productivity, peak cinema" lifestyle patterns
- Your cinematic seasons and life correlations

**4. Work-Week vs Weekend Cinema Split**
- Bar chart comparing weekday vs weekend viewing
- Time-of-day breakdowns within each category
- Work-life balance through movie consumption lens

**Insights:**
- "Friday nights are for subtitles" scheduling patterns
- When you prioritize movies vs other activities
- Your movie-watching work-life balance

**5. Taste vs Critical Consensus**
- Scatter plot or dumbbell chart comparing your ratings vs IMDb/Rotten Tomatoes
- Biggest disagreement highlights
- Agreement percentage calculations

**Insights:**
- "I loved it but critics didn't" contrarian discoveries
- "Critics were right, I was wrong" humbling moments
- How much you align with mainstream opinion

**6. Adventure vs Comfort Balance**
- Donut or stacked bar showing rewatches vs first-time watches
- Rewatch frequency by genre/rating
- Comfort food cinema identification

**Insights:**
- "Am I adventurous or emotionally attached?" viewing philosophy
- Which films serve as your reliable comfort watches
- Balance between exploration and familiarity

**7. Director Loyalty & Obsession Detection**
- Bar chart ranking directors by films watched
- Average rating overlays and consistency metrics
- Career span of your director relationships

**Insights:**
- "I didn't realize I'm basically a Nolan intern" accidental obsessions
- Directors you've unconsciously championed
- Hidden loyalties revealed through data

**8. Nostalgia vs Current Trends**
- Scatter plot or histogram of release year vs watch year
- Diagonal "current" line vs off-diagonal "nostalgia" zones
- Decade-by-decade catch-up patterns

**Insights:**
- "This is where my '90s phase lives" nostalgia mapping
- "Yes, I just watched that classic" current vs archival balance
- Whether you're a trend-follower or history-explorer

**Overall Personality Framework:**
- Composite "movie personality" score combining all factors
- Archetype matching (The Nostalgist, The Marathon Runner, The Contrarian, etc.)
- Personalized movie horoscope for next year
- Shareable personality cards with fun descriptions

### 28. "I Didn't Know You Could Chart That" - Quirky Behavioral Insights
**Chart Types:**

**1. Subtitle Reliance Index**
- Bar chart or scorecard showing subtitle usage percentage
- Split by genre, language, or country of origin
- Confidence intervals showing your subtitle comfort zones

**Insights:**
- "Proof that accents are my villain" - language accessibility patterns
- Which genres demand subtitles for you
- Hidden language preferences revealed through subtitle dependency

**2. Release Delay Timeline**
- Diverging bar chart showing time gaps between release and watch dates
- Color-coded by how "late" you were (weeks/months/years)
- Highlight extreme cases with personal context

**Insights:**
- "Watched 11 years late. Still cried" - your catch-up habits
- Whether you're a trend-follower or archival explorer
- Cultural timing preferences (immediate vs delayed consumption)

**3. Emotional Whiplash Index**
- Line chart tracking tone/emotion changes between consecutive movies
- Color-coded by genre transitions (Pixar → war drama spikes)
- Peak whiplash moments highlighted

**Insights:**
- "This transition should be illegal" - chaotic viewing patterns
- Your emotional scheduling tendencies
- How you curate (or don't curate) emotional journeys

**4. Ending Satisfaction Matrix**
- 2×2 quadrant grid (Expected→Unexpected × Satisfying→Regrettable)
- Movies plotted by ending surprise vs satisfaction level
- Hover details showing specific plot twists

**Insights:**
- "The movie that broke my suspension of disbelief" moments
- Your tolerance for plot twists and endings
- Ending preferences that define your taste

**5. Attention Span Reality Check**
- Scatter plot: Runtime vs movie start time
- Trend lines showing optimism vs reality
- Late-night long-movie regrets highlighted

**Insights:**
- "I have optimism, not discipline" - time management through movies
- Your circadian rhythm for cinematic commitment
- Realistic self-assessment of attention span

**6. Director Trust Fall Evolution**
- Multi-line chart showing rating progression per director
- Faith-building vs faith-destroying trajectories
- Career-long relationship tracking

**Insights:**
- "When I stopped believing" - director relationship arcs
- How your trust in filmmakers develops over time
- Loyalty patterns and breaking points

**7. Watch-Time Clock**
- 24-hour radial clock showing movie start times
- Density visualization of when you make questionable decisions
- Peak hours highlighted with activity levels

**Insights:**
- "Most questionable decisions after 9pm" - your cinematic chronotype
- Time-of-day movie decision quality
- Sleep deprivation's impact on taste

**8. Runtime Rhythm by Day**
- Bar chart showing average movie length per day of week
- Weekend indulgence vs weekday practicality
- Statistical significance of day-based preferences

**Insights:**
- "Long movie Sundays" vs "short Tuesday survival" patterns
- How your schedule dictates cinematic commitment
- Weekly rhythm of entertainment choices

**9. Social Taste Dichotomy**
- Split bar or Sankey diagram showing solo vs group genre preferences
- Statistical comparison of social vs private tastes
- Performative taste detection algorithms

**Insights:**
- "Alone: subtitles. Together: explosions" - social performance patterns
- How company affects your movie choices
- Authentic vs curated taste preferences

**10. Recommendation Compliance Audit**
- Gauge chart showing recommendation follow-through rate
- Breakdown by recommender type (friends vs critics vs algorithms)
- Rating correlation with recommendation source

**Insights:**
- "Who should stop recommending things" - recommender reliability scores
- Your susceptibility to different recommendation sources
- Social influence patterns in movie discovery

**11. Calendar Mood Effects**
- Scatter plot of movie ratings by day type (weekday vs weekend)
- Statistical analysis of calendar-based rating bias
- Mood attribution disclaimers for humorous effect

**Insights:**
- "Blames the calendar, not the movie" - external factor attribution
- Whether your rating generosity changes with schedule
- Calendar-based mood patterns in entertainment

**12. Trailer Deception Detector**
- Bar chart comparing trailer excitement vs actual ratings
- Marketing effectiveness vs personal enjoyment gap
- Most misleading trailers identification

**Insights:**
- "Marketing crimes committed against my trust" moments
- Your susceptibility to trailer manipulation
- Gap between expectations and reality

**13. Social Alignment Radar**
- Multi-axis radar chart comparing your tastes vs others
- Team/coworker/friend group averages overlaid
- Controversy hotspots identification

**Insights:**
- "Instantly interactive and funny" social comparison
- Taste alignment with different social groups
- Friendship-destroying taste disagreements

**14. Decision Regret Funnel**
- Conversion funnel showing decision journey
- Drop-off points from interest to completion
- Regret quantification and categorization

**Insights:**
- "Darkly relatable" decision-making failures
- Your commitment threshold patterns
- Self-awareness of poor movie choices

**Meta-Insights:**
- Pattern recognition algorithms to predict future regrets
- Behavioral quirk quantification and scoring
- "Most surprisingly you" statistics
- Quirky habit celebration rather than judgment

---

## Intern Implementation Roadmap

### Phase 0: CSV Structure Analysis (✅ COMPLETED)
1. **Obtain Sample Data** ✅
   - Received Letterboxd CSV export from user
   - Analyzed all major CSV files and their structures
   - Documented data types and field mappings

2. **Design Data Models** ✅
   - Created TypeScript interfaces based on actual CSV structure
   - Planned data transformation and validation logic

### Phase 1: Basic Web App Setup (2-3 days)
**Goal:** Create a functional HTML page with basic file upload interface

**Tasks:**
1. **HTML Structure**
   - Create `index.html` with basic structure
   - Add header, file upload area, and results section
   - Include CDN links for JSZip, PapaParse, D3.js, Chart.js

2. **Basic CSS Styling**
   - Clean, modern design with responsive layout
   - File upload drag-and-drop styling
   - Loading states and progress indicators

3. **File Upload Interface**
   - Drag-and-drop ZIP file upload area
   - File validation (size limit 50MB, .zip only)
   - User feedback for upload status

**Deliverables:**
- Working HTML page that opens in browser
- Styled file upload interface
- Basic error handling for invalid files

### Phase 2: CSV Processing Foundation (3-4 days)
**Goal:** Process uploaded ZIP files and parse CSV data into usable format

**Tasks:**
1. **ZIP File Handling**
   - Implement JSZip integration
   - Extract only whitelisted files: `diary.csv`, `reviews.csv`, `watched.csv`, `ratings.csv`
   - Security measures: size limits and content validation

2. **CSV Parsing**
   - Use PapaParse to convert CSV to JavaScript objects
   - Handle data type conversion (dates, numbers, strings)
   - Basic data validation and error handling

3. **Data Processing**
   - Transform raw CSV data into structured objects
   - Calculate basic statistics (total films, average rating, etc.)
   - Create data summary for display

**Deliverables:**
- Successfully processes uploaded ZIP files
- Parsed data displayed in console/table format
- Basic statistics shown to user
- Error handling for malformed data

### Phase 3: Core Analytics & Basic Charts (4-5 days)
**Goal:** Implement core data analysis and first visualizations

**Tasks:**
1. **Data Analysis Functions**
   - Rating distribution analysis
   - Release year breakdown
   - Monthly viewing patterns
   - Genre frequency analysis

2. **First Charts Implementation**
   - Rating distribution histogram/bar chart
   - Release year timeline
   - Monthly viewing activity chart
   - Top genres pie chart

3. **Basic Dashboard Layout**
   - Grid layout for multiple charts
   - Chart containers with proper sizing
   - Basic responsive design

**Deliverables:**
- 4-6 working charts displaying real data
- Clean dashboard layout
- Charts update when new data is uploaded
- Mobile-responsive design

### Phase 4: Advanced Charts & Features (5-7 days)
**Goal:** Add more sophisticated visualizations and user experience features

**Tasks:**
1. **Advanced Charts**
   - Controversy analysis (personal vs community ratings - if TMDB integrated)
   - Director analysis charts
   - Interactive calendar heatmap
   - Rating evolution over time

2. **Chart Selection System**
   - Checkbox interface to enable/disable charts
   - Organized chart categories
   - "Generate Charts" button

3. **TMDB Integration** (Optional - if time permits)
   - Basic TMDB API calls for movie metadata
   - Enhanced movie information display
   - Community rating comparisons

**Deliverables:**
- 8-12 total chart types implemented
- User can select which charts to generate
- TMDB integration for enhanced data (if implemented)
- Improved visual design and interactions

### Phase 5: Polish & Testing (3-4 days)
**Goal:** Refine the user experience and ensure everything works reliably

**Tasks:**
1. **UI/UX Improvements**
   - Enhanced visual design and animations
   - Better loading states and progress feedback
   - Error messages and user guidance

2. **Testing & Bug Fixes**
   - Test with different data sets
   - Edge case handling (missing data, large files)
   - Cross-browser compatibility

3. **Documentation & Deployment**
   - Update README with usage instructions
   - Add code comments for maintainability
   - Final performance optimizations

**Deliverables:**
- Polished, professional-looking application
- Comprehensive testing completed
- Clear documentation for users and developers
- Ready for production use

---

## Intern Development Guidelines

### Key Principles
1. **Start Simple**: Each phase builds on the previous one - don't try to implement everything at once
2. **Test Frequently**: Open `index.html` in browser after every major change
3. **Console Logging**: Use `console.log()` extensively for debugging
4. **Incremental Progress**: Get something working first, then improve it
5. **User Feedback**: Always think about what the user sees and needs

### Development Workflow
1. **Phase 1-2**: Focus on data processing - get CSV parsing working reliably first
2. **Phase 3**: Build core charts - start with simple bar/pie charts before complex visualizations
3. **Phase 4-5**: Add polish - user experience matters as much as functionality

### Technical Tips for Intern
- **File Structure**: Keep everything in one HTML file (inline CSS/JS)
- **CDN Libraries**: Use the exact CDN links provided in the plan
- **Data Flow**: Upload ZIP → Extract CSVs → Parse data → Generate charts
- **Error Handling**: Always check if data exists before using it
- **Performance**: Test with the sample data first, then larger datasets

### Success Checklist
- [ ] App opens in browser without errors
- [ ] Can upload and process ZIP file successfully
- [ ] Charts display actual data from CSV files
- [ ] Interface is responsive and user-friendly
- [ ] No console errors when processing data
- [ ] Works with the provided sample data

### Getting Help
- Start with simple examples from D3.js documentation
- Use browser developer tools for debugging
- Test with small data sets first
- Ask questions when stuck - better to clarify than guess

---

## Original Technical Implementation Details

### 29. Creative D3 Visualizations - "Beyond Standard Charts"
**Chart Types:**

**1. Movie Timeline Spiral**
- Spiral timeline winding through your movie history
- Dot size represents rating, color represents genre
- Interactive zooming and tooltips with movie details
- "Time flies when you're watching movies" visual metaphor

**Insights:**
- Visual density shows binge periods vs dry spells
- Color patterns reveal genre preferences over time
- Spiral metaphor captures the cyclical nature of movie discovery

**2. Genre Constellation Map**
- Force-directed graph connecting movies by shared attributes
- Movies as nodes, connections by genre/actor/director overlap
- Constellation clusters form around your favorite themes
- Interactive exploration with movie details on hover

**Insights:**
- "Your cinematic universe" - interconnected movie preferences
- Hidden connections between seemingly different films
- Visual clusters reveal your taste DNA

**3. Rating Sunburst Breakdown**
- Multi-level sunburst chart radiating from center
- Outer rings: genres, middle: decades, inner: ratings
- Interactive segments expand to show movie details
- Color gradients from center (ratings) outward

**Insights:**
- Hierarchical breakdown of your rating patterns
- How genre preferences change across eras
- Visual "slices of your taste" in concentric rings

**4. Movie Discovery Flow**
- Sankey diagram or flow visualization
- Shows paths from "recommended by friend" → "watched" → "rating"
- Width of flows represents frequency/enthusiasm
- Branching paths show successful vs failed recommendations

**Insights:**
- "Your recommendation ecosystem" - who influences your watching
- Most reliable sources for good movie finds
- Flow bottlenecks reveal picky taste areas

**5. Director Influence Network**
- Network graph with directors as central nodes
- Connecting lines show actor/director collaborations
- Node size based on your average rating for their films
- Interactive filtering by genre or time period

**Insights:**
- "Your director web" - interconnected creative relationships
- Most influential directors in your movie universe
- Hidden connections between directors through shared talent

**6. Cinematic Calendar Mosaic**
- Custom calendar heatmap with movie thumbnails
- Each day shows movie poster or rating indicator
- Hover reveals full movie details and watch notes
- Color coding by genre or rating satisfaction

**Insights:**
- "Your movie year at a glance" - visual memory palace
- Pattern recognition in your viewing schedule
- Emotional context of when you watched what

**7. Rating Evolution Streamgraph**
- Flowing, organic streams showing rating changes over time
- Stream thickness represents number of movies rated
- Color transitions show shifting genre preferences
- Smooth animations reveal taste evolution

**Insights:**
- "The flowing river of your taste" - organic evolution
- How your rating generosity changes over seasons
- Visual metaphor for taste maturation

**8. Movie DNA Double Helix**
- DNA-like helical structure with movie attributes
- One strand: genres, other strand: ratings
- Connected by "movie moments" or key scenes
- Interactive rotation and zooming

**Insights:**
- "Your movie genome" - genetic code of preferences
- How genre and quality preferences intertwine
- Unique fingerprint of your cinematic identity

**9. Genre Migration Animation**
- Animated transitions showing genre preference shifts
- Bubbles migrating between genre categories over time
- Smooth morphing shows taste evolution
- Play/pause controls for different time periods

**Insights:**
- "Genre nomad" - how your tastes migrate over years
- Sudden shifts vs gradual evolution
- External influences on taste changes

**10. Interactive Movie Atlas**
- Geographic visualization of film origins
- World map with movie counts by country/city
- Connected flight paths showing your global cinema journey
- Zoomable from world to city level

**Insights:**
- "Your world cinema passport" - global exploration
- Cultural biases in your movie selections
- Geographic diversity of your viewing habits

**11. Rating Constellation Sky**
- Starfield visualization with movies as stars
- Brightness based on rating, position based on genre clusters
- Constellations form around your favorite combinations
- Interactive stargazing with movie details

**Insights:**
- "Your movie night sky" - celestial metaphor for tastes
- Brightest stars are your all-time favorites
- Constellation patterns reveal taste galaxies

**12. Temporal Movie Waves**
- Waveform visualization of movies over time
- Amplitude shows rating intensity, frequency shows watch density
- Different colored waves for different genres
- Sound wave metaphor for your movie "music"

**Insights:**
- "The soundtrack of your movie life" - temporal patterns
- Rating volatility and watch frequency rhythms
- Harmonic analysis of your viewing patterns

**13. Movie Relationship Web**
- Complex network graph of movie interconnections
- Nodes: movies, edges: shared actors/genres/directors/themes
- Force-directed layout creates natural clusters
- Interactive exploration of movie relationships

**Insights:**
- "Six degrees of movie separation" - your film connections
- Hidden relationships between watched films
- Network analysis of your movie ecosystem

**14. Cinematic Universe Timeline**
- Multi-track timeline with interconnected movies
- Franchise connections, actor crossovers, director reunions
- Parallel timelines for different cinematic universes
- Zoomable from decades to specific release windows

**Insights:**
- "Your multiverse of movies" - connected film worlds
- How franchises and actors create viewing continuity
- Timeline of creative relationships you follow

**Technical Implementation:**
- **D3.js Core Features:** SVG manipulation, data binding, transitions, interactivity
- **Performance Optimization:** Canvas rendering for large datasets, virtual scrolling
- **Interactivity:** Hover effects, zooming, filtering, animations
- **Accessibility:** Keyboard navigation, screen reader support, high contrast modes
- **Responsive Design:** Adapts to different screen sizes while maintaining visual impact

**Creative Goals:**
- **Memorable:** Visualizations that stick in memory long after viewing
- **Interactive:** Encourage exploration and discovery
- **Personal:** Reflect unique aspects of individual movie journeys
- **Beautiful:** Leverage D3's power for stunning, data-driven art
- **Insightful:** Reveal patterns that standard charts can't show

5. **User Experience**
   - Clear status messages during processing
   - Error handling with user-friendly messages
   - Progress indicators for large files
   - Mobile-responsive design

### Phase 2: Chart Experimentation & Selection (EXPERIMENTATION PHASE)
**Goal:** Build all 28 chart types as modular components so you can easily experiment, choose favorites, and iterate on what works best

1. **Modular Chart Components**
   - Each chart type as a self-contained JavaScript module
   - Standardized interface (data in → chart out)
   - Easy enable/disable via checkboxes
   - Consistent styling and responsive design
   - Hot-swappable - add new charts without touching existing code

2. **Chart Categories Implementation**
   - **Basic Analytics (1-4):** Release years, ratings, controversy, genres
   - **Personality Insights (27):** The "what kind of movie person am I?" charts
   - **Behavioral Quirks (28):** The "I didn't know you could chart that" insights
   - **Director/Writer Analysis (5, 26):** Talent discovery and patterns
   - **Time-Based Patterns (6-10, 21-25):** Temporal and social analysis

3. **Interactive Chart Selection System**
   - **Master Checkbox Panel:** All 28 chart categories organized by theme
   - **Smart Preview:** Thumbnail previews before full generation
   - **One-Click Generation:** Generate all selected charts instantly
   - **A/B Testing Mode:** Compare different chart combinations
   - **Save/Load Configurations:** Remember your favorite chart sets

4. **Easy Chart Management**
   - **Add New Charts:** Drop in new chart modules without rebuilding
   - **Disable Charts:** Uncheck to remove from interface
   - **Reorder Charts:** Drag-and-drop positioning
   - **Chart Performance:** Built-in timing/metrics for each chart
   - **User Feedback:** Rate charts to identify favorites

5. **Export & Iteration Tools**
   - Export selected charts as high-res images
   - Generate shareable HTML reports with selected charts only
   - Chart usage analytics (which ones users select most)
   - Easy removal of underperforming charts
   - Version control for chart improvements

6. **Performance Optimization**
   - Lazy loading of chart libraries based on selection
   - Efficient data filtering and aggregation
   - Progressive chart rendering for large datasets
   - Memory management for multiple simultaneous charts

### Phase 3: Polish & TMDB Enhancement (Optional)
1. **TMDB Integration**
   - Movie metadata enrichment (posters, cast, crew)
   - Community rating comparisons
   - Genre standardization and enhancement

2. **UI/UX Refinement**
   - Improved chart styling and animations
   - Better mobile experience
   - Accessibility improvements
   - Loading states and error handling

3. **Advanced Features**
   - Custom time period filtering
   - Chart comparison modes
   - Data export options
   - Local storage for processed data

### Phase 4: Future Enhancements (Optional)
1. **Advanced Analytics**
   - Predictive recommendations
   - Social comparison features
   - Custom goal tracking

2. **Platform Features**
   - Multi-user comparisons
   - Chart sharing and embedding
   - API for third-party integrations

---

## Technical Considerations

### Data Privacy & Ethics
- Only process public Letterboxd data
- No storage of personal information
- Clear data usage transparency
- Option for local-only processing

### Performance
- Handle large film lists (1000+ films)
- Efficient data processing algorithms
- Progressive loading for better UX

### Scalability
- Modular architecture for adding new chart types
- Extensible data processing pipeline
- Plugin system for custom analyses

### Deployment
- Static site generation for fast loading
- CDN for global performance
- Offline capability for CSV uploads

---

## Success Metrics
- **Simplicity:** ✅ Single HTML file, no build tools, works offline
- **Security:** ✅ Safe ZIP extraction with bomb protection measures
- **Privacy:** ✅ Zero data transmission - everything stays local
- **Data Processing:** Successfully parse diary.csv with ratings and dates
- **User Experience:** Clear status messages, < 10 seconds processing time
- **Data Accuracy:** Correct parsing of CSV data (dates, ratings, film titles)
- **Chart Quality:** Full-width, responsive D3.js visualizations (600px height, container-width)
- **Performance:** Handle 1000+ films without browser freezing

## Risk Assessment
- **ZIP Bomb Protection:** ✅ Client-side size limits and content whitelisting prevent malicious uploads
- **Simplicity:** ✅ No build tools, frameworks, or complex dependencies to break
- **Browser Performance:** Large datasets may cause slowdowns - keep processing simple
- **Privacy & Security:** ✅ **Zero risk** - all processing client-side, no data transmission
- **CSV Format Changes:** Letterboxd may modify export format - code will need updates
- **Data Quality:** Handle missing ratings, inconsistent CSV data, encoding issues
- **Maintenance:** Simple codebase is easy to modify and debug
- **Browser Compatibility:** Modern browsers only (ES6+ features)

---

## Future Enhancements
- Multi-year analysis
- Social features (compare with friends)
- Predictive recommendations
- Integration with other media tracking services
- Mobile app companion
