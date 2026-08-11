# ***VIRAL CLIP FORGE, CLIP CREATOR AND CONTENT GENERATOR PROMPT***

Project Name: Viral Clip Forge (v2.0)

High-Level Goal:  
Build an intelligent, end-to-end content repurposing platform named "Viral Clip Forge." The platform will empower creators and marketers to upload long-form videos, use a co-pilot AI to identify and extract viral moments, and then instantly format, caption, and schedule these clips for social media, all within one seamless workflow.

---

### **Part 1: Core User Flow & Enhanced Frontend (UI/UX)**

Design a clean, intuitive, and highly interactive user interface.

1. Authentication & Onboarding:  
   * Standard sign-up/login (Email/Password, Google OAuth).  
   * Tiered Plan Selection: On sign-up, present clear subscription tiers (e.g., Free, Pro, Agency) with feature comparisons.  
   * Interactive onboarding that highlights the new co-pilot and social-ready features.  
2. The Dashboard / Project Hub: (Largely the same)  
   * Display projects with status ("Processing," "Action Required," "Complete").  
   * A prominent "Create New Project" button.  
3. Video Upload Page: (Largely the same)  
   * Multi-file drag-and-drop uploader. Supported formats: MP4, MOV, WEBM.  
4. Project Workspace / AI Co-pilot Controls:  
   * Left Panel: List of uploaded source videos.  
   * Right Panel: "AI Co-pilot Settings."  
     * Clip Length Selector: Dropdown/buttons for 30s, 60s, 90s, 120s, 180s, 240s, 300s.  
     * (NEW) AI Guidance \- Keywords: An optional text input field labeled "Keywords to focus on (e.g., 'AI', 'marketing tips', 'growth hack')." This will guide the AI to prioritize segments containing these terms.  
     * A "Start AI Analysis" button.  
5. (ENHANCED) Clip Review & Studio Page:  
   * This is the central hub for post-generation work. Display generated clips in a gallery.  
   * Each Clip Card will feature:  
     * Video preview.  
     * Source video name and timestamps.  
     * (NEW) AI Hook Type: A tag indicating the AI's classification of the clip (e.g., Hot Take, Question/Answer, Tutorial, Anecdote).  
     * (NEW) User Rating: Thumbs Up / Thumbs Down icons for the user to rate the AI's suggestion.  
     * A "Download" button and a new "Edit in Studio" button.  
6. (NEW) The Studio \- Interactive Editor:  
   * Clicking "Edit in Studio" opens a modal or new page with a powerful, user-friendly editor.  
   * Visual Timeline Editor:  
     * A video timeline showing audio waveforms.  
     * The AI-selected clip is highlighted, with draggable handles at the start and end, allowing the user to precisely trim or extend the clip by a few seconds.  
   * Social Formatting Module:  
     * Aspect Ratio: One-click buttons to reframe the video: 9:16 (Reels/TikTok), 1:1 (Square), 4:5 (Vertical), 16:9 (Original). The video preview should update instantly.  
   * Auto-Caption Module:  
     * An "Add Captions" toggle.  
     * When toggled on, it displays the AI-generated transcript for the clip segment in a text box. The user can easily correct any transcription errors.  
     * Caption Style Options (Pro Feature): Buttons to select from pre-designed caption styles (e.g., "Alex Hormozi style," "MrBeast style," clean minimalist).  
   * Branding Module (Pro Feature):  
     * An "Add Watermark" toggle to automatically apply the user's pre-uploaded logo to a corner of the video.  
   * A "Finalize & Export" button.  
7. (NEW) Content Scheduler:  
   * A dedicated page with a calendar view.  
   * Connect social media accounts (Meta for Facebook/Instagram, TikTok, LinkedIn, YouTube).  
   * Users can drag their finalized clips from a library onto the calendar to schedule them for posting.

---

### **Part 2: Enhanced Backend & Advanced AI Integration**

1. Video Ingestion & Storage: (Same as before) Use a cloud storage bucket.  
2. Job Processing Queue: (Same as before) Use a background queue for AI analysis and video processing.  
3. Core AI Analysis \- API Integration (Enhanced):  
   * The API request must provide:  
     * The video URL.  
     * The desired clip\_duration.  
     * (NEW) An optional array of user\_keywords.  
   * The AI's Enhanced Task:  
     * Perform all previous analysis (transcription, audio/visual emotion analysis).  
     * Prioritize segments that contain the user\_keywords.  
     * (NEW) Classify the 'hook type' of each potential clip (e.g., Hot Take, Question/Answer, Tutorial, Funny Anecdote). This adds valuable context for the user.  
   * The API response should return a list of clips, each with:  
     * start\_timestamp, end\_timestamp.  
     * confidence\_score.  
     * rationale (e.g., "laughter\_peak", "strong\_question").  
     * (NEW) hook\_type (the classification string).  
     * (NEW) The full transcript for the entire video.  
4. Video Processing & "Social Ready" Pipeline:  
   * Clipping: Use FFmpeg to perform the initial cut based on AI timestamps.  
   * (NEW) Re-encoding & Formatting: Create a separate, queued job for "Studio" edits. This job will use FFmpeg to:  
     * Re-encode the video to the selected aspect ratio (e.g., 9:16), potentially using smart cropping to keep the speaker centered.  
     * Burn in the styled captions using the edited transcript.  
     * Overlay the user's watermark/logo.  
   * Store all versions (original clip, social-ready versions) in cloud storage.  
5. (NEW) Social Media API Integration:  
   * Implement secure OAuth flows for connecting user social accounts.  
   * Build a service that uses the official APIs of Meta, TikTok, etc., to upload the finalized video and schedule it for the user-selected time.

---

### **Part 3: Expanded Database Schema**

* User: id, email, password\_hash, subscription\_id.  
* Subscription: id, plan\_type (free, pro, agency), status.  
* (NEW) BrandingKit: id, user\_id, logo\_url, primary\_color\_hex, font\_name.  
* Project: id, user\_id, name, status.  
* SourceVideo: id, project\_id, storage\_url, duration, full\_transcript\_json.  
* GeneratedClip: id, source\_video\_id, storage\_url\_original, storage\_url\_formatted (can be a JSON object of URLs), start\_time, end\_time, ai\_rationale\_text, hook\_type, user\_rating (1, \-1, or null).  
* (NEW) ScheduledPost: id, user\_id, generated\_clip\_id, social\_platform, post\_time, status (scheduled, posted, failed).

