const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'known_cities.json');
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const cities = db.cities || {};
const regions = db.regions || {};

const encyclopediaCities = {
  // --- Himachal Pradesh ---
  "shimla": {
    name: "Shimla", country: "India", state: "Himachal Pradesh",
    landmarks: ["Christ Church", "Viceregal Lodge", "Jakhoo Temple", "Gaiety Theatre", "The Ridge"],
    neighborhoods: ["Mall Road", "The Ridge", "Lakkar Bazaar", "Lower Bazaar"],
    food: ["Baljees", "Cafe Sol", "Wake & Bake Cafe", "Embassy Restaurant"],
    activities: ["Exploring Christ Church", "Touring the historic Viceregal Lodge", "Visiting Jakhoo Temple Hanumant statue", "Strolling along The Ridge"],
    shopping: ["Mall Road shopping", "Lakkar Bazaar wooden crafts", "Lower Bazaar local goods"],
    culture: ["Gaiety Theatre cultural events", "Former summer capital history", "Kalka-Shimla Toy Train ride"]
  },
  "manali": {
    name: "Manali", country: "India", state: "Himachal Pradesh",
    landmarks: ["Hadimba Temple", "Vashisht Hot Springs", "Manu Temple"],
    neighborhoods: ["Mall Road", "Old Manali", "Vashisht", "Solang Valley"],
    food: ["Johnson's Cafe trout", "Cafe 1947", "Drifters' Cafe", "German Bakery"],
    activities: ["Visiting Hadimba Temple wooden structure", "Bathing in Vashisht Hot Springs", "Strolling in Old Manali lanes", "Solang Valley paragliding", "Rohtang Pass excursion"],
    shopping: ["Mall Road woolens", "Old Manali lanes boho shops", "Himachali caps shopping"],
    culture: ["Manu Temple historic walk", "Leh-Ladakh road trip gateway", "Old Manali riverside live music"]
  },
  "mcleod ganj": {
    name: "McLeod Ganj", country: "India", state: "Himachal Pradesh",
    landmarks: ["Tsuglagkhang Complex", "Bhagsunath Temple", "Bhagsu Waterfall", "Namgyal Monastery"],
    neighborhoods: ["Temple Road", "Bhagsu", "Dharamkot", "Naddi"],
    food: ["Tibet Kitchen", "Common Ground Cafe", "Jimmy's Italian Kitchen", "Lung Ta Japanese Restaurant"],
    activities: ["Exploring Tsuglagkhang Dalai Lama temple", "Hiking to Bhagsu Waterfall", "Visiting Bhagsunath Temple", "Meditating at Namgyal Monastery"],
    shopping: ["Tibetan Market handicrafts", "Temple Road prayer flags", "McLeod Ganj local craft stalls"],
    culture: ["Tibetan government-in-exile heritage", "Dalai Lama residence tour", "Dharamkot cafe live music scene"]
  },
  "jibhi": {
    name: "Jibhi", country: "India", state: "Himachal Pradesh",
    landmarks: ["Jibhi Waterfall", "Chehni Kothi", "Shringa Rishi Temple"],
    neighborhoods: ["Jibhi village", "Chehni", "Tirthan valley road"],
    food: ["Cafe Sherni", "The Marwa Cafe", "Local homestay-cooked Himachali meals", "Freshly cooked trout fish"],
    activities: ["Hiking to Jibhi Waterfall", "Trekking to the 1500-year-old Chehni Kothi tower", "Visiting Shringa Rishi Temple", "Relaxing by bonfires in homestays"],
    shopping: ["Small general stores on main lane", "Local woolens stalls"],
    culture: ["Untouched wooden houses architecture", "Himachali traditional lifestyle", "Forest walks"]
  },
  "tirthan valley": {
    name: "Tirthan Valley", country: "India", state: "Himachal Pradesh",
    landmarks: ["Great Himalayan National Park", "Chhoie Waterfall"],
    neighborhoods: ["Banjar", "Gushaini", "Tirthan River bank"],
    food: ["Fresh-caught trout from local trout farms", "Homestay-cooked local Himachali food"],
    activities: ["Trekking in Great Himalayan National Park", "Hiking to Chhoie Waterfall", "Trout fishing in Tirthan River", "Riverside camping"],
    shopping: ["Basic general stores in Banjar and Gushaini villages"],
    culture: ["UNESCO World Heritage Site exploration", "Early-to-bed homestay culture", "Nature and birdwatching walks"]
  },
  "kasol": {
    name: "Kasol", country: "India", state: "Himachal Pradesh",
    landmarks: ["Manikaran Sahib", "Chalal village walk"],
    neighborhoods: ["Kasol Main Market", "Chalal", "Parvati Valley", "Kasol riverside"],
    food: ["Israeli cafes falafel and hummus", "Kasol German Bakery", "Evergreen Cafe"],
    activities: ["Bathing in Manikaran Sahib hot springs", "Walking the scenic path to Chalal village", "backpacker party and trance music scene in cafes", "Riverside bonfire gatherings", "Kheerganga trek baseline walk"],
    shopping: ["Kasol main market street", "Trance-print clothing shops", "Handmade jewelry stalls"],
    culture: ["Nicknamed 'Mini Israel' backpacker culture", "Parvati Valley spiritual walks"]
  },
  "spiti valley": {
    name: "Spiti Valley", country: "India", state: "Himachal Pradesh",
    landmarks: ["Key Monastery", "Chandratal Lake", "Dhankar Monastery", "Pin Valley National Park"],
    neighborhoods: ["Kaza", "Dhankar", "Kibber", "Langza"],
    food: ["Sol Cafe", "Kunzum Cafe Kaza", "Homestay-cooked Spitian food", "Thukpa and momos"],
    activities: ["Visiting Key Monastery ancient chambers", "Trekking around Chandratal Lake", "Exploring Dhankar Monastery cliffside ruins", "Spotting wildlife in Pin Valley National Park", "Night stargazing in cold desert"],
    shopping: ["Kaza local market", "Tibetan handicrafts shopping"],
    culture: ["Little Tibet high-altitude Buddhist culture", "Ancient mud-brick monastery visits"]
  },
  "bir billing": {
    name: "Bir Billing", country: "India", state: "Himachal Pradesh",
    landmarks: ["Bir Tibetan Colony", "Billing Paragliding site"],
    neighborhoods: ["Tibetan Colony", "Bir road", "Billing takeoff"],
    food: ["Café Prem", "Garden Cafe", "Tibetan eateries in colony"],
    activities: ["Paragliding takeoff from Billing and landing in Bir", "Visiting Bir Tibetan Colony monasteries", "Strolling through Bir village quiet fields"],
    shopping: ["Bir Tibetan Colony handicraft shops", "Local cafe shopping"],
    culture: ["Paragliding capital of India", "Tibetan monastic architecture and prayer wheels"]
  },
  "chitkul": {
    name: "Chitkul", country: "India", state: "Himachal Pradesh",
    landmarks: ["Mathi Temple", "Kamru Fort", "Baspa River views"],
    neighborhoods: ["Chitkul village", "Sangla", "Baspa riverbank"],
    food: ["Basic local dhabas", "Homestay traditional Himachali meals"],
    activities: ["Visiting Mathi Temple in Chitkul", "Exploring Kamru Fort in Sangla", "Strolling by Baspa River", "Hiking near Indo-Tibet border"],
    shopping: ["Local stalls selling Kinnauri woolens", "Dry fruits shopping"],
    culture: ["Last inhabited village before Indo-Tibet border", "Kinnauri traditional wooden architecture"]
  },
  "dalhousie": {
    name: "Dalhousie", country: "India", state: "Himachal Pradesh",
    landmarks: ["St. John's Church", "Khajjiar Lake", "Golden Devi Temple"],
    neighborhoods: ["Gandhi Chowk", "Subhash Chowk", "Khajjiar meadow"],
    food: ["Lovely Restaurant", "Cafe Nilgiri"],
    activities: ["Visiting colonial-era St. John's Church", "Walking around Khajjiar Lake meadow", "Visiting Golden Devi Temple", "Taking in panoramic Himalayan views"],
    shopping: ["Gandhi Chowk Tibetan handicrafts", "Subhash Chowk woolen markets"],
    culture: ["Colonial-era hill station architecture", "Mini Switzerland meadows and pine forests"]
  },

  // --- Punjab ---
  "amritsar": {
    name: "Amritsar", country: "India", state: "Punjab",
    landmarks: ["Golden Temple", "Harmandir Sahib", "Jallianwala Bagh", "Wagah Border", "Gobindgarh Fort", "Durgiana Temple"],
    neighborhoods: ["Hall Bazaar", "Guru Bazaar", "Ranjit Avenue", "Town Hall"],
    food: ["Kesar Da Dhaba", "Bharawan Da Dhaba", "Beera Chicken House", "Golden Temple Langar free kitchen", "Kulcha Land amritsari kulcha"],
    activities: ["Visiting Golden Temple at night", "Attending Wagah Border flag ceremony", "Walking through Jallianwala Bagh memorial", "Exploring Gobindgarh Fort light show"],
    shopping: ["Hall Bazaar textiles", "Guru Bazaar jewelry", "Katra Jaimal Singh Market phulkari"],
    culture: ["Sikhism holiest shrine heritage", "Independence struggle history at Jallianwala Bagh"]
  },
  "chandigarh": {
    name: "Chandigarh", country: "India", state: "Punjab",
    landmarks: ["Rock Garden", "Capitol Complex", "Sukhna Lake", "Rose Garden"],
    neighborhoods: ["Sector 17", "Sector 22", "Sector 26", "Sector 35"],
    food: ["Pal Dhaba Sector 28", "Backpackers Cafe", "Virgin Courtyard"],
    activities: ["Walking in Rock Garden recycled structures", "Boating on Sukhna Lake", "Touring Le Corbusier Capitol Complex", "Exploring Rose Garden", "Sector 26 and 35 student-driven bar and club scene"],
    shopping: ["Sector 17 Plaza", "Sector 22 Market"],
    culture: ["India first planned city architecture", "UNESCO Le Corbusier heritage"]
  },
  "patiala": {
    name: "Patiala", country: "India", state: "Punjab",
    landmarks: ["Qila Mubarak", "Sheesh Mahal", "Moti Bagh Palace"],
    neighborhoods: ["Adalat Bazaar", "City Centre", "Moti Bagh"],
    food: ["Local Punjabi dhabas Patiala peg hospitality", "Rich Punjabi foods"],
    activities: ["Exploring Qila Mubarak fort complex", "Visiting Sheesh Mahal Mirror Palace", "Strolling near Moti Bagh Palace"],
    shopping: ["Adalat Bazaar Patiala juttis", "Parandi hair tassels shopping"],
    culture: ["Patiala royal heritage", "Traditional Patiala peg and salwar culture"]
  },
  "anandpur sahib": {
    name: "Anandpur Sahib", country: "India", state: "Punjab",
    landmarks: ["Takht Sri Kesgarh Sahib", "Virasat-e-Khalsa museum"],
    neighborhoods: ["Gurudwara complex", "Anandpur town"],
    food: ["Langar at the Gurudwara complex", "Vegetarian Punjabi food"],
    activities: ["Paying respects at Takht Sri Kesgarh Sahib", "Touring Virasat-e-Khalsa museum", "Learning about Khalsa Panth founding"],
    shopping: ["Gurudwara complex religious souvenir stalls"],
    culture: ["Sikh pilgrimage town history", "Khalsa Panth founding site"]
  },

  // --- Haryana ---
  "gurugram": {
    name: "Gurugram", country: "India", state: "Haryana",
    landmarks: ["Sheetla Mata Mandir", "Sultanpur National Park", "Kingdom of Dreams"],
    neighborhoods: ["Sector 29", "Cyber Hub", "DLF Phase IV", "Sadar Bazaar"],
    food: ["Sector 29 restaurant strip", "Cyber Hub dining (Farzi Cafe, SodaBottleOpenerWala)", "Karma Kitchen"],
    activities: ["Visiting Sheetla Mata Mandir", "Birdwatching in Sultanpur National Park", "Cyber Hub and Sector 29 nightlife (Hard Rock Cafe, Tipsy Bull, Playboy Club)"],
    shopping: ["Sadar Bazaar", "Galleria Market DLF Phase IV", "Sector 29 shops"],
    culture: ["NCR Millennium City modern culture", "Kingdom of Dreams theater history"]
  },
  "kurukshetra": {
    name: "Kurukshetra", country: "India", state: "Haryana",
    landmarks: ["Brama Sarovar", "Jyotisar", "Kurukshetra Panorama Science Centre", "Sannihit Sarovar"],
    neighborhoods: ["Brama Sarovar area", "Jyotisar town"],
    food: ["Local Haryanvi dhabas", "Bajra Khichdi", "Fresh local lassi"],
    activities: ["Visiting Brama Sarovar sacred tank", "Seeing the holy Jyotisar banyan tree", "Touring Kurukshetra Panorama Science Centre"],
    shopping: ["Local bazaars near Brama Sarovar religious items and handicrafts"],
    culture: ["Mahabharata battleground history", "Bhagavad Gita narration site"]
  },
  "panchkula": {
    name: "Panchkula", country: "India", state: "Haryana",
    landmarks: ["Pinjore Gardens", "Yadavindra Gardens"],
    neighborhoods: ["Sector 5", "Pinjore"],
    food: ["Local Punjabi-Haryanvi restaurants"],
    activities: ["Strolling Pinjore Mughal terraced gardens", "Exploring Yadavindra Gardens", "Visiting Chandigarh tri-city bars"],
    shopping: ["Sector 5 Market Panchkula"],
    culture: ["Mughal garden architecture heritage"]
  },
  "surajkund": {
    name: "Surajkund", country: "India", state: "Haryana",
    landmarks: ["Surajkund reservoir", "Anangpur Dam"],
    neighborhoods: ["Surajkund Mela ground", "Anangpur"],
    food: ["Mela food stalls representing cuisines from across India"],
    activities: ["Visiting Surajkund ancient reservoir", "Exploring Anangpur Dam", "Attending Surajkund International Crafts Mela"],
    shopping: ["Surajkund International Crafts Mela local crafts (February)"],
    culture: ["Asia largest crafts fair heritage", "Traditional artisans showcase"]
  },

  // --- Rajasthan ---
  "jaipur": {
    name: "Jaipur", country: "India", state: "Rajasthan",
    landmarks: ["Amber Fort", "Hawa Mahal", "City Palace", "Jantar Mantar", "Nahargarh Fort"],
    neighborhoods: ["Johari Bazaar", "Bapu Bazaar", "Tripolia Bazaar", "Chandpole Bazaar"],
    food: ["Rawat Mishthan Bhandar pyaz kachori", "Laxmi Misthan Bhandar LMB", "Chokhi Dhani traditional dining", "Spice Court"],
    activities: ["Touring UNESCO Amber Fort", "Photographing Hawa Mahal", "Exploring Jantar Mantar instruments", "Watching sunset from Nahargarh Fort", "Jaipur Literature Festival events", "Bar Palladio nightlife, Peacock Rooftop, Club 14"],
    shopping: ["Johari gemstone and jewelry market", "Bapu Bazaar textiles and juttis", "Tripolia lac bangles and brassware"],
    culture: ["Pink City royal history", "Rajasthani folk performances and art"]
  },
  "udaipur": {
    name: "Udaipur", country: "India", state: "Rajasthan",
    landmarks: ["City Palace complex", "Lake Pichola", "Jag Mandir", "Sajjangarh Monsoon Palace", "Jagdish Temple"],
    neighborhoods: ["Hathi Pol", "Lal Ghat", "Bada Bazaar", "Lake Palace road"],
    food: ["Ambrai Restaurant lakeside dining", "Upre by 1559 AD", "Millets of Mewar"],
    activities: ["Boating on Lake Pichola", "Exploring Udaipur City Palace", "Visiting Jag Mandir island palace", "Watching sunset at Monsoon Palace", "Rooftop bar hangouts near Lal Ghat", "Lakeside cafe live music"],
    shopping: ["Hathi Pol Bazaar miniature paintings", "Bada Bazaar silver jewelry"],
    culture: ["Venice of the East lake culture", "Mewar dynasty royal history"]
  },
  "jaisalmer": {
    name: "Jaisalmer", country: "India", state: "Rajasthan",
    landmarks: ["Sonar Quila", "Patwon Ki Haveli", "Sam Sand Dunes"],
    neighborhoods: ["Jaisalmer Fort interior", "Sam Dunes desert camps"],
    food: ["Desert camp dinners with folk music", "Trio Restaurant"],
    activities: ["Exploring the living Jaisalmer Fort", "Trekking Sam Sand Dunes", "Desert camping under the stars", "Desert camp evenings with Rajasthani folk music and dance"],
    shopping: ["Fort-interior shops leather goods and mirror-work textiles"],
    culture: ["Living Golden Fort heritage", "Thar desert folk traditions"]
  },
  "jodhpur": {
    name: "Jodhpur", country: "India", state: "Rajasthan",
    landmarks: ["Mehrangarh Fort", "Umaid Bhawan Palace", "Jaswant Thada"],
    neighborhoods: ["Sardar Market", "Clock Tower", "Blue City lanes"],
    food: ["Gypsy Restaurant thali", "Shri Mishrilal Hotel makhaniya lassi"],
    activities: ["Touring Mehrangarh Fort", "Visiting Umaid Bhawan Palace museum", "Strolling Jaswant Thada cenotaph", "Rooftop cafe dining with fort-lit night views"],
    shopping: ["Sardar Market spices and handlooms", "Clock Tower textiles"],
    culture: ["Blue City indigo-washed heritage", "Marwar dynasty royal legacy"]
  },
  "pushkar": {
    name: "Pushkar", country: "India", state: "Rajasthan",
    landmarks: ["Pushkar Lake", "Brahma Temple"],
    neighborhoods: ["Pushkar Bazaar", "Lake Ghats"],
    food: ["Sixth Sense Cafe", "Honey & Spice organic food"],
    activities: ["Walking the 52 bathing ghats of Pushkar Lake", "Paying respects at Brahma Temple", "Attending lake-side evening aartis", "Pushkar Camel Fair Camel trading and cultural fair (November)"],
    shopping: ["Pushkar Bazaar silver jewelry and hippie-style clothing"],
    culture: ["One of the world few Brahma temples", "Spiritual lake culture"]
  },
  "ranthambore": {
    name: "Ranthambore", country: "India", state: "Rajasthan",
    landmarks: ["Ranthambore Fort", "Ranthambore National Park"],
    neighborhoods: ["Sawai Madhopur", "Park entrance road"],
    food: ["Resort-run dining", "Local Rajasthani dhabas"],
    activities: ["Tiger tracking safaris in Ranthambore National Park", "Climbing Ranthambore Fort ruins", "Wildlife photography"],
    shopping: ["Sawai Madhopur local handicraft stalls"],
    culture: ["UNESCO fort nestled in tiger reserve", "Wildlife conservation heritage"]
  },

  // --- Uttar Pradesh ---
  "agra": {
    name: "Agra", country: "India", state: "Uttar Pradesh",
    landmarks: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Itmad-ud-Daulah"],
    neighborhoods: ["Sadar Bazaar", "Taj Ganj", "Kinari Bazaar"],
    food: ["Pinch of Spice", "Panchhi Petha sweets", "Joney's Place"],
    activities: ["Visiting Taj Mahal at sunrise", "Exploring Agra Fort red sandstone walls", "Touring Fatehpur Sikri complex", "Hotel rooftop dining with Taj night views"],
    shopping: ["Sadar Bazaar marble inlay work and leather goods", "Kinari Bazaar crafts"],
    culture: ["Mughal empire capital history", "Taj Mahal architectural wonder"]
  },
  "varanasi": {
    name: "Varanasi", country: "India", state: "Uttar Pradesh",
    landmarks: ["Kashi Vishwanath Temple", "Dashashwamedh Ghat", "Sarnath", "Manikarnika Ghat"],
    neighborhoods: ["Vishwanath Gali", "Thatheri Bazaar", "Assi Ghat", "Gowdowlia"],
    food: ["Kashi Chat Bhandar tamatar chaat", "Blue Lassi Shop lassi", "Banarasi Paan stalls"],
    activities: ["Experiencing Dashashwamedh Ghat evening Ganga Aarti", "Taking a dawn boat ride on the Ganges", "Visiting Buddha first sermon site at Sarnath", "Strolling ancient Ganges ghats"],
    shopping: ["Vishwanath Gali Banarasi silk and religious items", "Thatheri Bazaar brassware"],
    culture: ["One of the oldest continuously inhabited cities", "Sacred Hindu spiritual heritage"]
  },
  "lucknow": {
    name: "Lucknow", country: "India", state: "Uttar Pradesh",
    landmarks: ["Bara Imambara", "Chota Imambara", "Rumi Darwaza", "Residency ruins"],
    neighborhoods: ["Aminabad", "Hazratganj", "Chowk"],
    food: ["Tunday Kababi galouti kebabs", "Idris Biryani", "Rahim's Kulche Nahari"],
    activities: ["Walking through Bara Imambara Bhool Bhulaiya maze", "Viewing Rumi Darwaza", "Exploring Hazratganj lounges and cafes after dark"],
    shopping: ["Aminabad Chikankari embroidery and street food", "Hazratganj boutiques"],
    culture: ["Nawabi tehzeeb culture", "Traditional Chikankari handloom heritage"]
  },
  "mathura-vrindavan": {
    name: "Mathura-Vrindavan", country: "India", state: "Uttar Pradesh",
    landmarks: ["Krishna Janmabhoomi Temple", "Banke Bihari Temple", "ISKCON Temple"],
    neighborhoods: ["Mathura town", "Vrindavan lanes"],
    food: ["Brijwasi Mishthan Bhandar peda sweets", "Local street sweets"],
    activities: ["Visiting Krishna Janmabhoomi Temple in Mathura", "Paying respects at Banke Bihari Temple", "Attending Vrindavan ISKCON Temple aarti", "Experiencing Lath Mar Holi in Barsana"],
    shopping: ["Local stalls Krishna idols and peda sweets"],
    culture: ["Birthplace of Lord Krishna", "Braj Holi celebrations"]
  },
  "ayodhya": {
    name: "Ayodhya", country: "India", state: "Uttar Pradesh",
    landmarks: ["Ram Janmabhoomi Temple", "Hanuman Garhi", "Kanak Bhawan"],
    neighborhoods: ["Ram Janmabhoomi complex", "Ayodhya ghats"],
    food: ["Local prasad sweets", "Vegetarian temple foods"],
    activities: ["Visiting Ram Janmabhoomi Temple (Ram Mandir)", "Climbing Hanuman Garhi temple steps", "Exploring Kanak Bhawan"],
    shopping: ["Small religious souvenir markets near temple complex"],
    culture: ["Birthplace of Lord Rama", "Sarayu River spiritual heritage"]
  },

  // --- Uttarakhand ---
  "rishikesh": {
    name: "Rishikesh", country: "India", state: "Uttarakhand",
    landmarks: ["Laxman Jhula & Ram Jhula", "Triveni Ghat", "Neelkanth Mahadev Temple", "Beatles Ashram"],
    neighborhoods: ["Laxman Jhula", "Triveni Ghat area", "Swarg Ashram", "Tapovan"],
    food: ["Chotiwala iconic thali", "Ganga Beach Cafe", "Rishikesh German Bakery"],
    activities: ["Crossing Laxman Jhula and Ram Jhula bridges", "Experiencing Triveni Ghat evening aarti", "Touring the historic Beatles Ashram", "Riverside bonfires at camps and cafe hangouts"],
    shopping: ["Laxman Jhula market yoga wear and silver jewelry", "Tibetan Market"],
    culture: ["Yoga Capital of the World", "The Beatles White Album composition heritage"]
  },
  "haridwar": {
    name: "Haridwar", country: "India", state: "Uttarakhand",
    landmarks: ["Har Ki Pauri", "Mansa Devi Temple", "Chandi Devi Temple"],
    neighborhoods: ["Bara Bazaar", "Har Ki Pauri ghats"],
    food: ["Chotiwala", "Mohan Puri Wala"],
    activities: ["Witnessing Har Ki Pauri evening Ganga Aarti", "Riding ropeway to Mansa Devi Temple", "Kumbh Mela pilgrimage gather (every 12 years)"],
    shopping: ["Bara Bazaar religious items and brassware"],
    culture: ["One of the holiest Hindu pilgrimage sites", "Sacred Ganges river culture"]
  },
  "nainital": {
    name: "Nainital", country: "India", state: "Uttarakhand",
    landmarks: ["Naini Lake", "Naina Devi Temple", "Snow View Point", "Tiffin Top"],
    neighborhoods: ["Mall Road", "Tallital", "Mallital"],
    food: ["Sakley's Restaurant", "Embassy Restaurant", "Sonam's Kitchen momos"],
    activities: ["Boating on Naini Lake", "Visiting Naina Devi Temple", "Riding cable car to Snow View Point", "Quiet hill-station evenings on Mall Road"],
    shopping: ["Mall Road Nainital woolens, Tibetan handicrafts, local jams"],
    culture: ["British-era lake hill station heritage"]
  },
  "mussoorie": {
    name: "Mussoorie", country: "India", state: "Uttarakhand",
    landmarks: ["Gun Hill", "Kempty Falls", "Camel's Back Road"],
    neighborhoods: ["Mall Road", "Landour", "Kempty"],
    food: ["Lovely Omelette Centre", "Cafe Ivy in Landour"],
    activities: ["Riding cable car to Gun Hill viewpoint", "Bathing in Kempty Falls", "Walking along Camel's Back Road", "Unwinding in hotel lounges"],
    shopping: ["Mall Road Mussoorie woolens and local crafts"],
    culture: ["Queen of the Hills colonial retreat", "Landour peaceful cantonment heritage"]
  },
  "auli": {
    name: "Auli", country: "India", state: "Uttarakhand",
    landmarks: ["Auli ski slopes", "Gurso Bugyal meadow", "Auli ropeway"],
    neighborhoods: ["Auli ski resort", "Joshimath base"],
    food: ["Resort-run ski restaurants"],
    activities: ["Skiing on Auli slopes", "Trekking Gurso Bugyal meadow", "Riding the long Auli ropeway", "Enjoying views of Nanda Devi"],
    shopping: ["Ski-gear rental shops"],
    culture: ["India premier skiing destination", "High-altitude Himalayan meadow culture"]
  },

  // --- Madhya Pradesh ---
  "indore": {
    name: "Indore", country: "India", state: "Madhya Pradesh",
    landmarks: ["Rajwada Palace", "Lal Bagh Palace", "Kanch Mandir"],
    neighborhoods: ["Sarafa Bazaar", "Chappan Dukan"],
    food: ["Sarafa Bazaar poha-jalebi, bhutte ka kees, garadu", "Vijay Chaat House", "Johnny Hot Dog"],
    activities: ["Exploring Rajwada Palace", "Visiting Lal Bagh Palace", "Seeing glass architecture at Kanch Mandir", "Indulging in Sarafa night food market till 3am"],
    shopping: ["Sarafa jewelry by day, night market by night", "Chappan Dukan 56-shop food street"],
    culture: ["Cleanest city in India", "Indore night-market food culture"]
  },
  "khajuraho": {
    name: "Khajuraho", country: "India", state: "Madhya Pradesh",
    landmarks: ["Khajuraho Western Group of Monuments", "Eastern Group", "Southern Group"],
    neighborhoods: ["Temple complex area", "Khajuraho town"],
    food: ["Raja's Cafe", "Mediterraneo Restaurant"],
    activities: ["Exploring UNESCO Khajuraho temples", "Watching the Evening Sound and Light show", "Touring erotic and mythological stone carvings"],
    shopping: ["Local handicraft stalls near temple complex"],
    culture: ["Chandela dynasty architectural heritage (950-1050 AD)"]
  },
  "bhopal": {
    name: "Bhopal", country: "India", state: "Madhya Pradesh",
    landmarks: ["Taj-ul-Masajid", "Upper & Lower Lake", "Bhimbetka rock shelters"],
    neighborhoods: ["Chowk Bazaar", "New Market", "Arera Colony"],
    food: ["Bapu Ki Kutia vegetarian thali", "Manohar Dairy & Restaurant rabri"],
    activities: ["Boating on Upper Lake", "Touring Taj-ul-Masajid mosque", "Visiting UNESCO Bhimbetka rock paintings nearby", "Hanging out in New Market lounges"],
    shopping: ["Chowk Bazaar old-city bangles and perfumes", "New Market"],
    culture: ["City of Lakes history", "Prehistoric art heritage at Bhimbetka"]
  },
  "bandhavgarh": {
    name: "Bandhavgarh", country: "India", state: "Madhya Pradesh",
    landmarks: ["Bandhavgarh Fort", "Bandhavgarh National Park"],
    neighborhoods: ["Tala village", "Park resort area"],
    food: ["Resort-run safari dining"],
    activities: ["Tiger tracking safaris in Bandhavgarh", "Visiting the ancient hilltop Bandhavgarh Fort"],
    shopping: ["Small local stalls near Tala village"],
    culture: ["High tiger density forest heritage", "Ancient fort within national park"]
  },
  "pachmarhi": {
    name: "Pachmarhi", country: "India", state: "Madhya Pradesh",
    landmarks: ["Pandav Caves", "Bee Falls", "Dhupgarh point"],
    neighborhoods: ["Pachmarhi town", "Satpura forest"],
    food: ["Local Madhya Pradesh-style restaurants"],
    activities: ["Exploring Pandav Caves", "Hiking to Bee Falls", "Watching sunset from Dhupgarh (highest Satpura point)"],
    shopping: ["Small local market in main town"],
    culture: ["Satpura Tiger Reserve hill station heritage"]
  },

  // --- Gujarat ---
  "ahmedabad": {
    name: "Ahmedabad", country: "India", state: "Gujarat",
    landmarks: ["Sabarmati Ashram", "Jama Masjid Ahmedabad", "Adalaj Stepwell", "Sidi Saiyyed Mosque"],
    neighborhoods: ["Law Garden", "Manek Chowk", "Sabarmati", "Adalaj"],
    food: ["Agashiye rooftop Gujarati thali", "Honest Restaurant pav bhaji", "Manek Chowk street food stalls"],
    activities: ["Touring Sabarmati Ashram", "Photographing Sidi Saiyyed stone lattice", "Exploring Adalaj Stepwell", "Manek Chowk street food night market, legally dry state cafe/dessert culture"],
    shopping: ["Law Garden Night Market mirror work and bandhani sarees", "Manek Chowk jewelry markets"],
    culture: ["First UNESCO World Heritage City in India", "Gandhian heritage sites"]
  },
  "rann of kutch": {
    name: "Rann of Kutch", country: "India", state: "Gujarat",
    landmarks: ["Statue of Unity at Kevadia", "White Rann salt desert", "Kalo Dungar"],
    neighborhoods: ["Rann Utsav tent city", "Kevadia", "Bhujodi"],
    food: ["Rann Utsav tent-city dining Kutchi thali", "Dabeli stalls"],
    activities: ["Walking the White Rann salt desert under full moon", "Visiting the world tallest Statue of Unity", "Exploring Kalo Dungar views", "Attending Rann Utsav festival camp dance and folk music"],
    shopping: ["Kutch handicraft villages Bhujodi weaving and Nirona Rogan art"],
    culture: ["Great Rann of Kutch salt desert heritage", "World tallest statue landmark"]
  },
  "gir national park": {
    name: "Gir National Park", country: "India", state: "Gujarat",
    landmarks: ["Gir National Park wildlife sanctuary"],
    neighborhoods: ["Sasan Gir village", "Park resort area"],
    food: ["Resort-run Gujarati thali joints"],
    activities: ["Spotting Asiatic lions on Gir safari", "Birdwatching in Gir forest"],
    shopping: ["Small local stalls near Sasan Gir village"],
    culture: ["Only wild Asiatic lion habitat in the world"]
  },
  "somnath": {
    name: "Somnath", country: "India", state: "Gujarat",
    landmarks: ["Somnath Temple first Jyotirlinga"],
    neighborhoods: ["Veraval", "Somnath temple road"],
    food: ["Local Gujarati thali joints in Veraval and Somnath"],
    activities: ["Paying respects at Somnath Temple", "Walking Somnath beach", "Watching temple light and sound show"],
    shopping: ["Small stalls near temple selling religious souvenirs"],
    culture: ["Highly significant Shiva pilgrimage heritage"]
  },
  "dwarka": {
    name: "Dwarka", country: "India", state: "Gujarat",
    landmarks: ["Dwarkadhish Temple", "Bet Dwarka island"],
    neighborhoods: ["Dwarka temple area", "Bet Dwarka ferry"],
    food: ["Simple vegetarian thali restaurants"],
    activities: ["Visiting Dwarkadhish Temple", "Taking ferry to Bet Dwarka island", "Walking Dwarka ghats"],
    shopping: ["Local stalls near Dwarkadhish Temple"],
    culture: ["One of the Char Dham pilgrimage sites", "Krishna ancient sunken kingdom legend"]
  },

  // --- Maharashtra ---
  "mumbai": {
    name: "Mumbai", country: "India", state: "Maharashtra",
    landmarks: ["Gateway of India", "CST Railway Station", "Elephanta Caves", "Haji Ali Dargah", "Siddhivinayak Temple"],
    neighborhoods: ["Colaba", "Bandra", "Lower Parel", "Worli", "Marine Drive", "Chor Bazaar"],
    food: ["Ashok Vada Pav", "Britannia & Co. Parsi berry pulav", "Trishna seafood", "Bademiya late-night kebabs", "Leopold Cafe"],
    activities: ["Walking Marine Drive Queens Necklace", "Taking ferry to Elephanta Caves", "Bandra nightlife strip (Toto's Garage, The Daddy, Hoppipola)", "Lower Parel and Worli clubs (Trilogy, Royalty)"],
    shopping: ["Colaba Causeway jewelry", "Crawford Market spices", "Fashion Street budget wear", "Chor Bazaar antiques", "Linking Road Bandra boutiques"],
    culture: ["Home of Bollywood cinema", "Colonial-era architecture landmarks", "Haji Ali Dargah sea walk"]
  },
  "lonavala": {
    name: "Lonavala", country: "India", state: "Maharashtra",
    landmarks: ["Karla and Bhaja Caves", "Tiger's Leap viewpoint", "Bhushi Dam"],
    neighborhoods: ["Lonavala town", "Khandala"],
    food: ["Maganlal Chikki Wala peanut brittle", "Grace Restaurant"],
    activities: ["Exploring Karla and Bhaja Buddhist rock-cut caves", "Taking in views from Tiger's Leap", "Visiting Bhushi Dam", "Hanging out in resort lounges"],
    shopping: ["Lonavala Chikki Market peanut/sesame brittle"],
    culture: ["Monsoon weekend nature getaway heritage"]
  },
  "aurangabad": {
    name: "Aurangabad", country: "India", state: "Maharashtra",
    landmarks: ["Ajanta Caves", "Ellora Caves", "Kailasa Temple", "Bibi Ka Maqbara"],
    neighborhoods: ["Ellora complex", "Ajanta complex", "Himayat Bagh"],
    food: ["Naivedyam", "Bhoj Restaurant Rajasthani/Gujarati thali"],
    activities: ["Exploring UNESCO Ajanta Buddhist cave paintings", "Exploring UNESCO Ellora Caves and Kailasa Temple", "Visiting Bibi Ka Maqbara tomb"],
    shopping: ["Himayat Bagh area Paithani sarees and Himroo shawls"],
    culture: ["Ellora Kailasa Temple single rock-cut marvel", "Heritage day-trip destination"]
  },
  "pune": {
    name: "Pune", country: "India", state: "Maharashtra",
    landmarks: ["Shaniwar Wada", "Aga Khan Palace", "Sinhagad Fort"],
    neighborhoods: ["Koregaon Park", "JM Road", "FC Road", "Kalyani Nagar", "Tulshibaug"],
    food: ["Vaishali Restaurant South Indian", "Goodluck Cafe Bun Maska", "German Bakery"],
    activities: ["Exploring Shaniwar Wada fort palace", "Touring Gandhi memorial at Aga Khan Palace", "Trekking to Sinhagad Fort", "Koregaon Park college-town nightlife (High Spirits, Malaka Spice)"],
    shopping: ["FC Road and JM Road student shopping", "Tulshibaug traditional markets"],
    culture: ["Oxford of the East educational heritage", "Peshwa Maratha history sites"]
  },
  "mahabaleshwar": {
    name: "Mahabaleshwar", country: "India", state: "Maharashtra",
    landmarks: ["Mahabaleshwar Temple", "Arthur's Seat viewpoint", "Elephant's Head Point"],
    neighborhoods: ["Mahabaleshwar market", "Mapro Garden area"],
    food: ["Mapro Garden strawberry desserts", "Grapevine Restaurant"],
    activities: ["Visiting historic Mahabaleshwar Temple", "Viewing valleys from Arthur's Seat and Elephant's Head", "Eating fresh strawberries at Mapro Garden"],
    shopping: ["Local stalls selling strawberries, homemade jams, and chikki"],
    culture: ["Strawberry capital of India hill station heritage"]
  },

  // --- Goa ---
  "baga & calangute": {
    name: "Baga & Calangute", country: "India", state: "Goa",
    landmarks: ["Fort Aguada", "Chapora Fort"],
    neighborhoods: ["Baga Beach", "Calangute Beach", "Arpora"],
    food: ["Fisherman's Wharf", "Britto's on Baga Beach"],
    activities: ["Sunbathing on Baga and Calangute Beach", "Touring historic Fort Aguada", "Partying along Tito's Lane in Baga (Tito's, Mambo's clubs)"],
    shopping: ["Saturday Night Market Arpora live music, shopping, food"],
    culture: ["Indo-Portuguese beach culture", "High-energy coastal lifestyle"]
  },
  "anjuna & vagator": {
    name: "Anjuna & Vagator", country: "India", state: "Goa",
    landmarks: ["Chapora Fort Dil Chahta Hai fame", "Anjuna red cliffs"],
    neighborhoods: ["Anjuna Beach", "Vagator Beach", "Assagao"],
    food: ["Gunpowder in Assagao", "Curlies Beach Shack"],
    activities: ["Climbing Chapora Fort", "Walking Anjuna red cliffs", "Dancing at Curlies and Shiva Valley beach clubs", "Trance parties at Hilltop Anjuna", "Silent Noise headphone party"],
    shopping: ["Anjuna Flea Market Wednesday hippie market"],
    culture: ["Birthplace of Goa trance music culture (1960s-70s)"]
  },
  "panaji": {
    name: "Panaji", country: "India", state: "Goa",
    landmarks: ["Basilica of Bom Jesus", "Se Cathedral", "Fontainhas Latin Quarter"],
    neighborhoods: ["Fontainhas", "Panjim waterfront", "Mapusa"],
    food: ["Viva Panjim Goan fish curry", "Mum's Kitchen"],
    activities: ["Walking the colorful lanes of Fontainhas Latin Quarter", "Touring UNESCO Basilica of Bom Jesus and Se Cathedral", "Mandovi River cruise and casino boat lounges"],
    shopping: ["Mapusa Friday Market local crafts and spices"],
    culture: ["UNESCO Bom Jesus holds St. Francis Xavier relics", "Fontainhas Portuguese-era houses heritage conservation zone"]
  },
  "palolem & agonda": {
    name: "Palolem & Agonda", country: "India", state: "Goa",
    landmarks: ["Cabo de Rama Fort"],
    neighborhoods: ["Palolem Beach", "Agonda Beach", "Margao"],
    food: ["Martin's Corner legendary seafood", "Zeebop By The Sea"],
    activities: ["Sunbathing on Palolem Beach", "Exploring Cabo de Rama Fort ruins", "Silent beach bonfires and acoustic music at small shacks"],
    shopping: ["Margao Municipal Market spices and cashews"],
    culture: ["Laid-back South Goa beach vibe", "Calmer alternative to North Goa"]
  },

  // --- Karnataka ---
  "bengaluru": {
    name: "Bengaluru", country: "India", state: "Karnataka",
    landmarks: ["Bangalore Palace", "Lalbagh Botanical Garden", "Vidhana Soudha", "Bull Temple"],
    neighborhoods: ["Koramangala", "Indiranagar", "MG Road", "Brigade Road", "Commercial Street", "Chickpet"],
    food: ["Mavalli Tiffin Room MTR since 1924", "Vidyarthi Bhavan dosa", "Truffles burgers", "Empire Restaurant"],
    activities: ["Touring Bangalore Palace", "Strolling Lalbagh Botanical Garden greenhouses", "Pub crawling in Koramangala (Toit Brewpub) and Indiranagar's 100 Feet Road"],
    shopping: ["Commercial Street", "Chickpet wholesale textiles and jewelry", "Russell Market"],
    culture: ["Silicon Valley of India", "Pub Capital craft beer scene"]
  },
  "hampi": {
    name: "Hampi", country: "India", state: "Karnataka",
    landmarks: ["Virupaksha Temple", "Vittala Temple stone chariot", "Lotus Mahal", "Elephant Stables"],
    neighborhoods: ["Hampi Bazaar", "Virupapur Gaddi across river"],
    food: ["Mango Tree Restaurant", "Laughing Buddha Cafe"],
    activities: ["Exploring UNESCO Hampi Group of Monuments", "Crossing the river to Virupapur Gaddi backpacker cafes", "Watching sunset from Matanga Hill"],
    shopping: ["Hampi Bazaar street stalls handicrafts and beads"],
    culture: ["Capital of Vijayanagara Empire ruins", "Ancient Dravidian temple architecture"]
  },
  "mysuru": {
    name: "Mysuru", country: "India", state: "Karnataka",
    landmarks: ["Mysore Palace", "Chamundi Hills Temple", "St. Philomena's Church"],
    neighborhoods: ["Mysore Palace area", "Devaraja Market"],
    food: ["Vinayaka Mylari dosa", "Mylari Dosa"],
    activities: ["Touring Mysore Palace", "Climbing Chamundi Hills Temple steps", "Visiting St. Philomena's Church", "Experiencing Mysore Dasara festival (October)"],
    shopping: ["Devaraja Market flowers, spices, and sandalwood products"],
    culture: ["Wodeyar dynasty royal history", "Mysore Palace illumination heritage"]
  },
  "coorg": {
    name: "Coorg", country: "India", state: "Karnataka",
    landmarks: ["Abbey Falls", "Raja's Seat viewpoint", "Madikeri Fort"],
    neighborhoods: ["Madikeri", "Coffee estates"],
    food: ["Coorg home-style Pandi Pork Curry", "Coorg Cuisine Restaurant"],
    activities: ["Hiking to Abbey Falls", "Relaxing at Raja's Seat viewpoint", "Exploring Madikeri Fort", "Resort campfire evenings amid coffee plantations"],
    shopping: ["Local spice and coffee shops along Madikeri main road"],
    culture: ["Coffee Capital of India rolling plantation landscapes"]
  },
  "gokarna": {
    name: "Gokarna", country: "India", state: "Karnataka",
    landmarks: ["Mahabaleshwar Temple", "Om Beach"],
    neighborhoods: ["Kudle Beach", "Gokarna town"],
    food: ["Namaste Cafe on Om Beach", "Prema Restaurant"],
    activities: ["Visiting sacred Mahabaleshwar Temple", "Relaxing on Om Beach", "Laid-back backpacker beach-bonfires and beach hopping"],
    shopping: ["Small local stalls in Gokarna town selling beachwear and souvenirs"],
    culture: ["Spiritual and quieter beach alternative to Goa"]
  },

  // --- Kerala ---
  "kochi": {
    name: "Kochi", country: "India", state: "Kerala",
    landmarks: ["Chinese Fishing Nets Fort Kochi", "Mattancherry Palace", "Santa Cruz Basilica", "Jewish Synagogue Jew Town"],
    neighborhoods: ["Fort Kochi", "Mattancherry", "Jew Town"],
    food: ["Dhe Puttu", "Kayees Rahmathulla Cafe Malabar biryani", "Fort House Restaurant"],
    activities: ["Watching Chinese Fishing Nets operate", "Exploring Mattancherry Palace murals", "Visiting Jewish Synagogue", "Watching nightly Kathakali dance performances", "Exploring relaxed Fort Kochi art galleries and beachfront bars"],
    shopping: ["Mattancherry Spice Market spice trade hub", "Jew Town antiques shops"],
    culture: ["3,000-year-old spice trade hub history", "Indo-European colonial heritage"]
  },
  "alleppey": {
    name: "Alleppey", country: "India", state: "Kerala",
    landmarks: ["St. Mary's Forane Church", "Alappuzha Lighthouse", "Krishnapuram Palace nearby"],
    neighborhoods: ["Punnamada Lake backwaters", "Alleppey Beach"],
    food: ["Houseboat-cooked Kerala Sadya meals", "Halais Restaurant"],
    activities: ["Cruising on an overnight backwater houseboat", "Visiting Alappuzha Lighthouse", "Exploring Krishnapuram Palace", "Watching Nehru Trophy Snake Boat Race (August)"],
    shopping: ["Local boat-side markets coir products and spices"],
    culture: ["Venice of the East backwater canals", "Traditional houseboat lifestyle"]
  },
  "munnar": {
    name: "Munnar", country: "India", state: "Kerala",
    landmarks: ["Eravikulam National Park Nilgiri Tahr", "Mattupetty Dam", "Top Station viewpoint"],
    neighborhoods: ["Munnar town", "Tea estates"],
    food: ["Saravana Bhavan Munnar", "Rapsy Restaurant"],
    activities: ["Spotting Nilgiri Tahr at Eravikulam National Park", "Boating at Mattupetty Dam", "Viewing mountains from Top Station", "Walking tea estates and relaxing by resort campfires"],
    shopping: ["Local tea and spice shops along Munnar main road"],
    culture: ["Western Ghats tea plantation landscapes", "Spices cultivation heritage"]
  },
  "wayanad": {
    name: "Wayanad", country: "India", state: "Kerala",
    landmarks: ["Edakkal Caves ancient petroglyphs", "Chembra Peak", "Banasura Sagar Dam"],
    neighborhoods: ["Kalpetta", "Sulthan Bathery"],
    food: ["Homestay-cooked Kerala meals", "Pepper Trail specialty dining"],
    activities: ["Trekking to Edakkal Caves petroglyphs", "Hiking to Chembra Peak heart-shaped lake", "Boating at Banasura Sagar Dam (largest earth dam in India)"],
    shopping: ["Small local spice markets in Kalpetta"],
    culture: ["Tribal heritage and wildlife sanctuaries conservation"]
  },
  "varkala": {
    name: "Varkala", country: "India", state: "Kerala",
    landmarks: ["Varkala Cliff", "Janardhana Swamy Temple"],
    neighborhoods: ["Varkala Cliff top", "Varkala Beach"],
    food: ["Clafouti Cafe", "Cafe Del Mar clifftop dining"],
    activities: ["Sunbathing on Varkala Beach", "Visiting the 2,000-year-old Janardhana Swamy Temple", "Enjoying clifftop bars and cafes with sunset views and live music"],
    shopping: ["Cliff-top shops selling clothing, jewelry, and souvenirs"],
    culture: ["Dramatic red cliffs and Arabian Sea coastline landscape"]
  },

  // --- Tamil Nadu ---
  "chennai": {
    name: "Chennai", country: "India", state: "Tamil Nadu",
    landmarks: ["Kapaleeshwarar Temple", "Santhome Basilica", "Fort St. George", "Marina Beach"],
    neighborhoods: ["Mylapore", "T. Nagar", "Nungambakkam", "OMR", "Pondy Bazaar"],
    food: ["Murugan Idli Shop", "Saravana Bhavan", "Karpagambal Mess"],
    activities: ["Visiting Kapaleeshwarar Temple", "Walking Marina Beach (world second longest beach)", "Experiencing Chennai December Music Season Carnatic music sabhas", "Hanging out at Nungambakkam bars"],
    shopping: ["T. Nagar silk sarees and jewelry", "Pondy Bazaar street shops"],
    culture: ["Dravidian culture and Carnatic classical music heritage"]
  },
  "madurai": {
    name: "Madurai", country: "India", state: "Tamil Nadu",
    landmarks: ["Meenakshi Amman Temple", "Thirumalai Nayakkar Palace"],
    neighborhoods: ["Temple area", "Puthu Mandapam"],
    food: ["Murugan Idli Shop original branch", "Jigarthanda street food stalls"],
    activities: ["Exploring Meenakshi Amman Temple painted gopurams", "Touring Thirumalai Nayakkar Palace", "Tasting local Jigarthanda drink"],
    shopping: ["Puthu Mandapam traditional textiles and handicrafts near temple"],
    culture: ["Ancient temple city Dravidian architecture icon"]
  },
  "mahabalipuram": {
    name: "Mahabalipuram", country: "India", state: "Tamil Nadu",
    landmarks: ["Shore Temple", "Five Rathas", "Arjuna's Penance rock relief"],
    neighborhoods: ["Mahabalipuram beach area", "Stone carving street"],
    food: ["Le Yogi Cafe", "Moonrakers seafood restaurant"],
    activities: ["Exploring UNESCO Shore Temple", "Visiting Five Rathas rock temples", "Hanging out at beachside cafes with chilled evening vibes"],
    shopping: ["Local stone-carving workshops and souvenir shops"],
    culture: ["7th-8th century Pallava dynasty rock-cut sculptures"]
  },
  "ooty": {
    name: "Ooty", country: "India", state: "Tamil Nadu",
    landmarks: ["Ooty Lake", "Botanical Gardens", "Doddabetta Peak"],
    neighborhoods: ["Charing Cross", "Ooty Lake area"],
    food: ["Earl's Secret", "Hot Breads"],
    activities: ["Boating on Ooty Lake", "Walking through Botanical Gardens", "Hiking Doddabetta Peak (highest peak in Nilgiris)", "Riding UNESCO Nilgiri Mountain Railway Toy Train"],
    shopping: ["Charing Cross Market chocolates, eucalyptus oil, and tea"],
    culture: ["British-era hill station Nilgiris tea estates landscape"]
  },
  "rameswaram": {
    name: "Rameswaram", country: "India", state: "Tamil Nadu",
    landmarks: ["Ramanathaswamy Temple long corridor", "Dhanushkodi ghost town"],
    neighborhoods: ["Temple area", "Dhanushkodi beach"],
    food: ["Local Tamil vegetarian thali joints near temple"],
    activities: ["Walking the long pillared corridors of Ramanathaswamy Temple", "Excursion to Dhanushkodi ghost town beach ruins", "Bathing in 22 sacred temple wells"],
    shopping: ["Local stalls selling shell crafts and religious items"],
    culture: ["Char Dham pilgrimage site", "Evocative abandoned coastal settlement of Dhanushkodi"]
  },

  // --- Telangana ---
  "hyderabad": {
    name: "Hyderabad", country: "India", state: "Telangana",
    landmarks: ["Charminar", "Golconda Fort", "Qutb Shahi Tombs", "Chowmahalla Palace", "Ramoji Film City"],
    neighborhoods: ["Laad Bazaar", "Banjara Hills", "Jubilee Hills", "Gachibowli", "Begum Bazaar"],
    food: ["Paradise Restaurant biryani", "Bawarchi", "Shah Ghouse Cafe haleem", "Pista House"],
    activities: ["Exploring historic Charminar", "Sound and light show at Golconda Fort", "Touring Ramoji Film City (world largest film studio complex)", "Jubilee Hills and Banjara Hills nightlife (10 Downing Street, Prism Club)"],
    shopping: ["Laad Bazaar lac bangles and pearls", "Begum Bazaar", "Sultan Bazaar"],
    culture: ["Nizami royal heritage", "GI-tagged Hyderabadi Biryani food culture"]
  },
  "warangal": {
    name: "Warangal", country: "India", state: "Telangana",
    landmarks: ["Warangal Fort", "Thousand Pillar Temple", "Ramappa Temple"],
    neighborhoods: ["Fort road", "Temple area"],
    food: ["Local Telangana-style restaurants in main town"],
    activities: ["Exploring Warangal Fort stone arches", "Visiting Thousand Pillar Temple", "Touring UNESCO Ramappa Temple floating bricks"],
    shopping: ["Local handicraft stalls near fort complex"],
    culture: ["Kakatiya dynasty architecture heritage", "UNESCO Ramappa Temple engineering"]
  },

  // --- Andhra Pradesh ---
  "tirupati": {
    name: "Tirupati", country: "India", state: "Andhra Pradesh",
    landmarks: ["Sri Venkateswara Temple Tirumala", "Sri Padmavathi Temple"],
    neighborhoods: ["Tirumala hills", "Tirupati town"],
    food: ["Tirumala temple dining halls free meals", "Local 'mess' eateries serving Andhra meals"],
    activities: ["Paying respects at Sri Venkateswara Temple (richest Hindu temple)", "Climbing Tirumala pathway", "Tasting GI-tagged Tirupati Laddu prasadam"],
    shopping: ["Tirupati local bazaars temple souvenirs, brass items, prasadam laddus"],
    culture: ["World most-visited Hindu pilgrimage site heritage"]
  },
  "visakhapatnam": {
    name: "Visakhapatnam", country: "India", state: "Andhra Pradesh",
    landmarks: ["RK Beach", "Kailasagiri Hill Park", "Araku Valley", "Borra Caves"],
    neighborhoods: ["MVP Colony", "Jagadamba Junction", "RK Beach road"],
    food: ["Mommy's Kitchen", "Local Andhra seafood joints along RK Beach"],
    activities: ["Walking along RK Beach", "Riding ropeway to Kailasagiri Hill Park", "Scenic train ride to Araku Valley coffee plantations", "Exploring ancient Borra Caves", "Hanging out at beachside lounges and hotel bars"],
    shopping: ["MVP Colony Market", "Jagadamba Junction shopping"],
    culture: ["Port city heritage", "Eastern Ghats Araku coffee plantations landscape"]
  },
  "vijayawada": {
    name: "Vijayawada", country: "India", state: "Andhra Pradesh",
    landmarks: ["Kanaka Durga Temple", "Undavalli Caves", "Prakasam Barrage"],
    neighborhoods: ["MG Road", "Temple hill"],
    food: ["Hotel Minerva", "Local Andhra 'mess' eateries"],
    activities: ["Visiting Kanaka Durga Temple on hilltop", "Exploring Undavalli Caves monolithic rock-cut chambers", "Viewing Prakasam Barrage across Krishna River"],
    shopping: ["MG Road Vijayawada textiles market"],
    culture: ["Krishna River commercial and cultural hub heritage"]
  },

  // --- West Bengal ---
  "kolkata": {
    name: "Kolkata", country: "India", state: "West Bengal",
    landmarks: ["Victoria Memorial", "Howrah Bridge", "Dakshineswar Kali Temple", "St. Paul's Cathedral", "Indian Museum"],
    neighborhoods: ["Park Street", "College Street", "New Market", "Gariahat", "Camac Street"],
    food: ["Flurys tea and cakes", "Peter Cat chelo kebab", "Bhojohori Manna traditional Bengali", "Mishti Doi shops"],
    activities: ["Exploring Victoria Memorial white marble", "Walking across historic Howrah Bridge", "Visiting Dakshineswar Temple", "Kolkata nightlife along Park Street (Trincas, Mocambo, Some Place Else) and Camac Street lounges", "Durga Puja festival events (October)"],
    shopping: ["New Market colonial arcade", "College Street book market (world largest second-hand book market)", "Gariahat Market sarees"],
    culture: ["Cultural Capital of India", "Former capital of British India heritage"]
  },
  "darjeeling": {
    name: "Darjeeling", country: "India", state: "West Bengal",
    landmarks: ["Darjeeling Himalayan Railway Toy Train", "Tiger Hill", "Peace Pagoda", "Batasia Loop"],
    neighborhoods: ["Chowrasta Mall", "Nehru Road"],
    food: ["Glenary's bakery since 1900s", "Kunga Restaurant Tibetan food"],
    activities: ["Riding UNESCO Toy Train", "Watching sunrise over Kanchenjunga from Tiger Hill", "Walking Chowrasta Mall", "Quiet hill-station evenings with live acoustic cafe music"],
    shopping: ["Chowrasta Mall tea, handicrafts, woolens", "Nehru Road local shops"],
    culture: ["Darjeeling tea estates heritage", "Kanchenjunga Himalayan panoramas"]
  },
  "sundarbans": {
    name: "Sundarbans", country: "India", state: "West Bengal",
    landmarks: ["Sundarbans National Park mangrove forest"],
    neighborhoods: ["Gosaba", "Godkhali"],
    food: ["Boat-cruise-run traditional Bengali fish meals"],
    activities: ["Wildlife boat safari to spot Royal Bengal tigers in Sundarbans", "Exploring mangrove forest waterways"],
    shopping: ["Small local stalls in Gosaba and Godkhali selling forest honey and local crafts"],
    culture: ["UNESCO World Heritage site", "World largest mangrove forest ecosystem"]
  },
  "digha": {
    name: "Digha", country: "India", state: "West Bengal",
    landmarks: ["Digha Beach", "Marine Aquarium and Research Centre"],
    neighborhoods: ["New Digha beach", "Old Digha beach"],
    food: ["Beachside seafood shacks", "Freshly prepared fish fry"],
    activities: ["Relaxing on Digha Beach", "Visiting Marine Aquarium", "Beachside seafood dining and walking in quiet beach town"],
    shopping: ["Beachside stalls selling shell crafts and local souvenirs"],
    culture: ["West Bengal popular beach weekend retreat"]
  },

  // --- Odisha ---
  "puri": {
    name: "Puri", country: "India", state: "Odisha",
    landmarks: ["Jagannath Temple", "Puri Beach"],
    neighborhoods: ["Grand Road", "Puri Beach road"],
    food: ["Jagannath Temple Mahaprasad temple kitchen", "Local Odia thali joints"],
    activities: ["Visiting Jagannath Temple (Char Dham site)", "Walking Puri Beach", "Puri Rath Yatra festival chariot festival (June/July)"],
    shopping: ["Grand Road market applique work, conch shells, palm-leaf paintings"],
    culture: ["Major Hindu spiritual center heritage", "Odia traditional temple art"]
  },
  "konark": {
    name: "Konark", country: "India", state: "Odisha",
    landmarks: ["Konark Sun Temple stone chariot"],
    neighborhoods: ["Temple complex area", "Konark town"],
    food: ["Local Odia eateries in Konark town"],
    activities: ["Exploring UNESCO Konark Sun Temple chariot structure", "Visiting Konark Museum"],
    shopping: ["Small craft stalls near the temple complex"],
    culture: ["Architecturally significant Sun Temple heritage (13th century)"]
  },
  "bhubaneswar": {
    name: "Bhubaneswar", country: "India", state: "Odisha",
    landmarks: ["Lingaraj Temple", "Mukteshwar Temple", "Udayagiri-Khandagiri Caves"],
    neighborhoods: ["Saheed Nagar", "Jaydev Vihar", "Ekamra Haat"],
    food: ["Dalma Restaurant traditional Odia food", "Hare Krishna Restaurant"],
    activities: ["Visiting 11th-century Lingaraj Temple", "Exploring Mukteshwar Temple carvings", "Walking Udayagiri-Khandagiri rock-cut caves", "Hanging out in Saheed Nagar lounges"],
    shopping: ["Ekamra Haat handicrafts and Odia textiles", "Saheed Nagar market"],
    culture: ["Temple City of India", "Kalinga style temple architecture"]
  },
  "chilika lake": {
    name: "Chilika Lake", country: "India", state: "Odisha",
    landmarks: ["Chilika Lake lagoon", "Satapada dolphin spotting"],
    neighborhoods: ["Satapada", "Mangalajodi"],
    food: ["Boat-tour-run fresh seafood meals crabs and prawns"],
    activities: ["Boating on Chilika Lake", "Spotting Irrawaddy dolphins at Satapada", "Birdwatching at Mangalajodi (winter migratory birds)"],
    shopping: ["Small local fishing-village stalls selling shells and fish"],
    culture: ["Asia largest brackish-water lagoon heritage"]
  },

  // --- Bihar ---
  "bodh gaya": {
    name: "Bodh Gaya", country: "India", state: "Bihar",
    landmarks: ["Mahabodhi Temple", "Great Buddha Statue", "International monasteries"],
    neighborhoods: ["Mahabodhi temple area", "Monastery road"],
    food: ["Local Bihari thali joints", "Tibetan momos at monastery-run cafes"],
    activities: ["Meditating under the sacred Bodhi Tree at Mahabodhi Temple", "Viewing the giant 80-foot Great Buddha Statue", "Touring Thai, Japanese, Bhutanese monasteries"],
    shopping: ["Stalls near Mahabodhi Temple selling Buddhist artifacts and prayer flags"],
    culture: ["UNESCO site where Buddha attained enlightenment", "Global Buddhist pilgrimage center"]
  },
  "nalanda & rajgir": {
    name: "Nalanda & Rajgir", country: "India", state: "Bihar",
    landmarks: ["Nalanda University ruins", "Vishwa Shanti Stupa Rajgir", "Rajgir hot springs"],
    neighborhoods: ["Nalanda ruins", "Rajgir town"],
    food: ["Local eateries in Rajgir town", "Traditional Bihari sweets"],
    activities: ["Exploring UNESCO Nalanda University ruins", "Riding ropeway to Vishwa Shanti Stupa", "Bathing in Rajgir hot springs"],
    shopping: ["Small local stalls near Nalanda ruins selling souvenirs"],
    culture: ["World first residential university history (5th century CE)", "Ancient peace pagoda monument"]
  },
  "patna": {
    name: "Patna", country: "India", state: "Bihar",
    landmarks: ["Patna Sahib Gurudwara", "Golghar granary"],
    neighborhoods: ["Maurya Lok", "Boring Road", "Fraser Road", "Gandhi Maidan"],
    food: ["Local litti-chokha stalls near Gandhi Maidan", "Bikaner Sweets"],
    activities: ["Paying respects at Takht Sri Patna Sahib (birthplace of Guru Gobind Singh)", "Climbing Golghar for city views", "Visiting Boring Road and Fraser Road bars and restaurants"],
    shopping: ["Maurya Lok Complex shopping", "Patna Market"],
    culture: ["Ancient city Pataliputra history", "Sikhism birthplace heritage"]
  },

  // --- Jharkhand ---
  "ranchi": {
    name: "Ranchi", country: "India", state: "Jharkhand",
    landmarks: ["Hundru Falls", "Ranchi Rock Garden", "Tagore Hill", "Pahari Mandir"],
    neighborhoods: ["Main Road", "Harmu Road", "Firayalal"],
    food: ["Local eateries around Main Road (Litti Chokha, Dhuska)"],
    activities: ["Hiking to Hundru Falls", "Strolling in Ranchi Rock Garden", "Climbing Tagore Hill", "Visiting Harmu Road bars and lounges"],
    shopping: ["Firayalal Market Main Road shopping", "Tribal craft haats on outskirts"],
    culture: ["City of Waterfalls", "Jharkhand tribal craft heritage"]
  },
  "deoghar": {
    name: "Deoghar", country: "India", state: "Jharkhand",
    landmarks: ["Baidyanath Temple Jyotirlinga"],
    neighborhoods: ["Temple complex road", "Deoghar bazaar"],
    food: ["Local prasad sweets peda", "Vegetarian eateries near temple"],
    activities: ["Visiting Baidyanath Temple", "Participating in Shravani Mela pilgrimage (July/August)"],
    shopping: ["Temple-adjacent stalls selling religious items and peda sweets"],
    culture: ["Highly significant Shiva pilgrimage heritage"]
  },
  "netarhat": {
    name: "Netarhat", country: "India", state: "Jharkhand",
    landmarks: ["Netarhat sunset and sunrise points"],
    neighborhoods: ["Netarhat plateau", "Pine forest area"],
    food: ["Local guesthouse-run meals traditional tribal touch"],
    activities: ["Watching panoramic sunrise and sunset over plateau", "Walking through pine forest", "Stargazing at night"],
    shopping: ["Very limited small local stalls"],
    culture: ["Queen of Chotanagpur hill station heritage"]
  },

  // --- Chhattisgarh ---
  "jagdalpur": {
    name: "Jagdalpur", country: "India", state: "Chhattisgarh",
    landmarks: ["Chitrakote Falls Niagara of India", "Kanger Valley National Park"],
    neighborhoods: ["Jagdalpur town", "Bastar tribal area"],
    food: ["Local tribal cuisine (Chila, Faraa, red ant chutney)"],
    activities: ["Viewing Chitrakote Falls (widest waterfall in India)", "Exploring Kanger Valley National Park caves", "Attending Bastar Dussehra (75-day long festival)"],
    shopping: ["Jagdalpur Haat weekly tribal market bell metal craft, Dhokra art"],
    culture: ["Bastar tribal craft and Dussehra festival heritage"]
  },
  "raipur": {
    name: "Raipur", country: "India", state: "Chhattisgarh",
    landmarks: ["Mahant Ghasidas Memorial Museum", "Vivekananda Sarovar"],
    neighborhoods: ["Pandri", "Gol Bazaar", "New Raipur"],
    food: ["Local 'Bhaji Pat' style eateries", "Chila", "Bafauri"],
    activities: ["Visiting Mahant Ghasidas Museum", "Strolling around Vivekananda Sarovar", "Visiting lounges in newer parts of city"],
    shopping: ["Pandri Market handlooms", "Gol Bazaar local items"],
    culture: ["State capital history", "Gateway to Bastar forest regions"]
  },

  // --- Assam ---
  "guwahati": {
    name: "Guwahati", country: "India", state: "Assam",
    landmarks: ["Kamakhya Temple", "Umananda Temple river island", "Assam State Museum"],
    neighborhoods: ["Fancy Bazaar", "GS Road", "Sualkuchi"],
    food: ["Paradise Restaurant Assamese thali", "Khorikaa ethnic restaurant"],
    activities: ["Paying respects at Kamakhya Temple hilltop", "Taking ferry to Umananda Temple", "Exploring Assam State Museum", "Guwahati nightlife bar/lounge scene around GS Road"],
    shopping: ["Fancy Bazaar silk and handicrafts", "Sualkuchi village silk weaving (Muga silk)"],
    culture: ["Gateway to Northeast", "Kamakhya Shakti Peeth spiritual heritage"]
  },
  "kaziranga": {
    name: "Kaziranga", country: "India", state: "Assam",
    landmarks: ["Kaziranga National Park wildlife sanctuary"],
    neighborhoods: ["Kohora", "Bagori", "Park entrance area"],
    food: ["Resort-run traditional Assamese thali restaurants"],
    activities: ["One-horned rhino tracking safari in Kaziranga", "Elephant safari", "Visiting orchid park"],
    shopping: ["Small local handicraft stalls near park entrance selling cane items"],
    culture: ["UNESCO site home to two-thirds of world one-horned rhinos"]
  },
  "majuli island": {
    name: "Majuli Island", country: "India", state: "Assam",
    landmarks: ["Kamalabari Satra", "Auniati Satra Vaishnavite monasteries"],
    neighborhoods: ["Kamalabari", "Garamur"],
    food: ["Local Assamese homestay-cooked fish meals and rice beer"],
    activities: ["Exploring Kamalabari and Auniati Satra monasteries", "Watching traditional mask-making and pottery", "Cycling around Majuli river island"],
    shopping: ["Small local craft markets selling handwoven masks and clay pottery"],
    culture: ["World largest river island", "Neo-Vaishnavite monastic culture heritage"]
  },

  // --- Meghalaya ---
  "shillong": {
    name: "Shillong", country: "India", state: "Meghalaya",
    landmarks: ["Ward's Lake", "Don Bosco Museum", "Elephant Falls"],
    neighborhoods: ["Police Bazaar", "Laitumkhrah"],
    food: ["Trattoria Restaurant traditional Khasi Jadoh", "City Hut Family Dhaba"],
    activities: ["Boating on Ward's Lake", "Exploring Don Bosco Museum indigenous exhibits", "Viewing Elephant Falls", "Rock Capital of India live music scene in Police Bazaar pubs"],
    shopping: ["Police Bazaar handicrafts and local winter clothing"],
    culture: ["Khasi matrilineal society heritage", "Northeast rock music culture"]
  },
  "cherrapunji": {
    name: "Cherrapunji", country: "India", state: "Meghalaya",
    landmarks: ["Nohkalikai Falls", "Mawsmai Caves", "Seven Sisters Falls"],
    neighborhoods: ["Sohra town", "Nongriat track"],
    food: ["Local home-stay run traditional Khasi meals"],
    activities: ["Viewing Nohkalikai Falls (highest plunge waterfall in India)", "Exploring dark limestone Mawsmai Caves", "Hiking around Cherrapunji valleys"],
    shopping: ["Small local stalls selling forest honey and Khasi handicrafts"],
    culture: ["Sohra wettest place on Earth heritage"]
  },
  "living root bridges": {
    name: "Living Root Bridges", country: "India", state: "Meghalaya",
    landmarks: ["Double-Decker Living Root Bridge Nongriat"],
    neighborhoods: ["Nongriat village", "Tyrna village base"],
    food: ["Simple homestay-run Khasi meals in Nongriat village"],
    activities: ["Trekking down 3,000 steps from Tyrna to Nongriat", "Walking across the Double-Decker Living Root Bridge", "Swimming in natural pools"],
    shopping: ["None commercial market reached via steep trek only"],
    culture: ["Rubber tree root bio-engineering marvel grown over generations"]
  },
  "mawlynnong": {
    name: "Mawlynnong", country: "India", state: "Meghalaya",
    landmarks: ["Living root bridge smaller version", "Sky View bamboo tower"],
    neighborhoods: ["Mawlynnong village"],
    food: ["Homestay-cooked simple Khasi meals"],
    activities: ["Climbing Sky View bamboo tower for Bangladesh views", "Walking through the manicured flower paths of the village", "Crossing local root bridge"],
    shopping: ["Small local handicraft stalls selling bamboo items"],
    culture: ["Cleanest village in Asia heritage"]
  },

  // --- Arunachal Pradesh ---
  "tawang": {
    name: "Tawang", country: "India", state: "Arunachal Pradesh",
    landmarks: ["Tawang Monastery", "Sela Pass", "Madhuri Lake"],
    neighborhoods: ["Tawang town", "Monastery area"],
    food: ["Local Monpa-tribe eateries", "Thukpa and momos"],
    activities: ["Exploring Tawang Monastery (second-largest in the world)", "Crossing the high-altitude Sela Pass", "Walking around Madhuri Lake (Shungetser Lake)"],
    shopping: ["Small local market for Tibetan-style handicrafts and woolens"],
    culture: ["Monpa Buddhist heritage", "Dalai Lama historic escape route landmark"]
  },
  "ziro valley": {
    name: "Ziro Valley", country: "India", state: "Arunachal Pradesh",
    landmarks: ["Ziro Valley landscape", "Apatani tribal villages"],
    neighborhoods: ["Ziro town", "Hong village"],
    food: ["Apatani tribal cuisine smoked meats", "Apong local rice beer at homestays"],
    activities: ["Walking through Hong Apatani village to see facial tattoos", "Attending Ziro Music Festival (September outdoor festival)"],
    shopping: ["Local Apatani weekly markets traditional bamboo and cane baskets"],
    culture: ["UNESCO tentative site", "Apatani tribe sustainable wet-rice cultivation heritage"]
  },

  // --- Nagaland ---
  "kohima": {
    name: "Kohima", country: "India", state: "Nagaland",
    landmarks: ["Kohima War Cemetery", "Dzukou Valley wildflowers", "Kohima Cathedral"],
    neighborhoods: ["Kohima town", "Kisama heritage village"],
    food: ["Local Naga eateries smoked pork with bamboo shoot", "Axone traditional dish"],
    activities: ["Visiting WWII Kohima War Cemetery", "Trekking Dzukou Valley", "Attending Hornbill Festival Kisama (December 1-10 concerts/wrestling)"],
    shopping: ["Kohima Local Market tribal textiles, woodcrafts, Naga shawls"],
    culture: ["Hornbill Festival showcasing 17 major Naga tribes heritage"]
  },
  "mon district": {
    name: "Mon District", country: "India", state: "Nagaland",
    landmarks: ["Traditional Konyak tribal villages", "Longwa village border"],
    neighborhoods: ["Longwa village", "Mon town"],
    food: ["Local Konyak tribal cuisine in village homestays"],
    activities: ["Visiting Longwa village chief house (straddling India-Myanmar border)", "Meeting Konyak tattooed former headhunters", "Exploring village metalwork workshops"],
    shopping: ["Small local craft markets selling beaded necklaces and metal work"],
    culture: ["Konyak headhunting clan history and woodcarving heritage"]
  },

  // --- Manipur ---
  "imphal": {
    name: "Imphal", country: "India", state: "Manipur",
    landmarks: ["Kangla Fort", "Loktak Lake floating islands", "Keibul Lamjao National Park"],
    neighborhoods: ["Ima Keithel", "Kangla area", "Moirang"],
    food: ["Local Manipuri eateries near market", "Eromba", "Chak-hao black rice Kheer"],
    activities: ["Exploring historic Kangla Fort royal seat", "Boating on Loktak Lake among floating phumdis", "Spotting Sangai deer in Keibul Lamjao (world only floating national park)"],
    shopping: ["Ima Keithel (Mother's Market - run entirely by women for centuries, one of Asia largest)"],
    culture: ["Birthplace of modern Polo", "Loktak Lake unique floating ecosystem"]
  },

  // --- Mizoram ---
  "aizawl": {
    name: "Aizawl", country: "India", state: "Mizoram",
    landmarks: ["Solomon's Temple", "Durtlang Hills viewpoint", "Reiek Mountain nearby"],
    neighborhoods: ["Bara Bazaar", "Durtlang"],
    food: ["Local Mizo restaurants around Bara Bazaar", "Bai vegetarian stew", "Sawhchiar rice meat dish"],
    activities: ["Visiting the white marble Solomon's Temple", "Viewing Aizawl from Durtlang Hills", "Hiking Reiek Mountain", "Cafe and church-community evening culture hangouts"],
    shopping: ["Bara Bazaar local bamboo crafts and handwoven Mizo textiles"],
    culture: ["Mizo traditional bamboo weaving and Christian choral music heritage"]
  },

  // --- Tripura ---
  "agartala": {
    name: "Agartala", country: "India", state: "Tripura",
    landmarks: ["Ujjayanta Palace museum", "Neermahal water palace"],
    neighborhoods: ["MBB College area", "Agartala centre", "Melaghar water palace"],
    food: ["Local eateries", "Mui Borok traditional Tripuri tribal cuisine", "bamboo shoot dishes"],
    activities: ["Touring royal Ujjayanta Palace", "Boating on Rudrasagar Lake to Neermahal palace", "Hanging out in Agartala city center lounges"],
    shopping: ["Local handicraft stalls near MBB College area"],
    culture: ["Neermahal India largest lake water palace heritage"]
  },
  "unakoti": {
    name: "Unakoti", country: "India", state: "Tripura",
    landmarks: ["Unakoti rock carvings ancient sculptures"],
    neighborhoods: ["Kailashahar", "Unakoti hills"],
    food: ["Local Tripuri food in nearby village homestays"],
    activities: ["Hiking Unakoti hills to see massive rock-cut Shiva carvings", "Exploring ancient stone relief carvings"],
    shopping: ["Very limited small local stalls selling clay items"],
    culture: ["8th-9th century ancient rock-cut Shiva carvings pilgrimage heritage"]
  },

  // --- Sikkim ---
  "gangtok": {
    name: "Gangtok", country: "India", state: "Sikkim",
    landmarks: ["Rumtek Monastery", "Enchey Monastery", "Tsomgo Lake", "Nathula Pass"],
    neighborhoods: ["MG Marg", "Deorali"],
    food: ["Local Gangtok eateries momos and Thukpa", "Gundruk local spinach", "Tongba millet beer"],
    activities: ["Visiting Rumtek Monastery chambers", "Boating on high-altitude Tsomgo Lake", "Driving through Nathula Pass India-China border", "MG Marg pedestrian-only street cafe and bar scene"],
    shopping: ["MG Marg pedestrian-only shopping street"],
    culture: ["India first fully organic state", "Tibetan Buddhist monastery heritage"]
  },
  "pelling": {
    name: "Pelling", country: "India", state: "Sikkim",
    landmarks: ["Pemayangtse Monastery", "Khecheopalri Lake wish-fulfilling", "Yuksom coronation site"],
    neighborhoods: ["Pelling bazaar", "Yuksom village"],
    food: ["Local homestay-cooked Sikkimese meals", "Sikkimese noodle soup"],
    activities: ["Visiting the historic Pemayangtse Monastery", "Paying respects at sacred Khecheopalri Lake", "Walking through Yuksom forest (Sikkim first capital)"],
    shopping: ["Small local handicraft shops in Pelling"],
    culture: ["Yuksom starting point for Kanchenjunga trek", "Nyingma Buddhist historical legacy"]
  },
  "north sikkim": {
    name: "North Sikkim", country: "India", state: "Sikkim",
    landmarks: ["Gurudongmar Lake high-altitude", "Yumthang Valley of Flowers"],
    neighborhoods: ["Lachen village", "Lachung village", "Yumthang"],
    food: ["Homestay-run local hot meals (soups, rice)"],
    activities: ["Trekking around high-altitude Gurudongmar Lake (5,430m)", "Walking the flower paths of Yumthang Valley", "Relaxing in remote alpine Lachen/Lachung villages"],
    shopping: ["None basic supply shops only in remote villages"],
    culture: ["High-altitude alpine valley landscape", "Yumthang Valley rhododendron blooms (spring)"]
  },

  // --- Union Territories: Delhi ---
  "old delhi": {
    name: "Old Delhi", country: "India", state: "Delhi",
    landmarks: ["Red Fort", "Jama Masjid Delhi", "Fatehpuri Masjid"],
    neighborhoods: ["Chandni Chowk", "Dariba Kalan", "Khari Baoli", "Kinari Bazaar"],
    food: ["Karim's Mughlai kebabs", "Paranthe Wali Gali", "Al Jawahar", "Jalebi Wala sweet shop"],
    activities: ["Exploring UNESCO Red Fort", "Visiting Jama Masjid (India largest mosque)", "Rickshaw ride in busy Chandni Chowk lanes", "Late-night Mughlai street food dining in lanes"],
    shopping: ["Chandni Chowk 350-year-old spice and textile market", "Dariba Kalan silver market", "Khari Baoli spice market", "Kinari Bazaar wedding wear"],
    culture: ["Mughal empire capital Shahjahanabad heritage"]
  },
  "new delhi": {
    name: "New Delhi", country: "India", state: "Delhi",
    landmarks: ["Qutub Minar", "Humayun's Tomb", "India Gate", "Lotus Temple", "Akshardham Temple", "Rashtrapati Bhavan"],
    neighborhoods: ["Khan Market", "Sarojini Nagar", "Connaught Place", "Hauz Khas Village", "Aerocity", "Janpath", "Dilli Haat"],
    food: ["Bukhara ITC Maurya world-famous dal", "Indian Coffee House Connaught Place", "Haldiram's sweets"],
    activities: ["Touring UNESCO Qutub Minar and Humayun's Tomb", "Evening walk at India Gate lawns", "Viewing Lotus Temple architecture", "Hauz Khas Village lake view rooftop bars", "Connaught Place pubs (Pegasus, Q'BA)", "Aerocity clubs (Kitty Su)"],
    shopping: ["Khan Market luxury boutiques", "Sarojini Nagar budget fashion market", "Dilli Haat state-wise crafts", "Janpath Market"],
    culture: ["Lutyens' Delhi colonial architecture heritage", "Modern cosmopolitan capital culture"]
  },

  // --- Jammu and Kashmir ---
  "srinagar": {
    name: "Srinagar", country: "India", state: "Jammu and Kashmir",
    landmarks: ["Shankaracharya Temple", "Hazratbal Shrine", "Jama Masjid Srinagar", "Shalimar Bagh", "Nishat Bagh Mughal Gardens"],
    neighborhoods: ["Dal Lake", "Lal Chowk", "Polo View", "Zaina Kadal"],
    food: ["Ahdoos traditional Wazwan feast", "Mughal Darbar", "Houseboat-hosted Kahwa tea sessions"],
    activities: ["Taking a peaceful Shikara ride on Dal Lake", "Staying in an iconic Dal Lake houseboat", "Walking through Shalimar and Nishat Mughal Gardens", "Quiet evenings on houseboats"],
    shopping: ["Lal Chowk Pashmina shawls and carpets", "Polo View Market woodcrafts", "Zaina Kadal papier-mache crafts"],
    culture: ["Mughal Gardens heritage", "Dal Lake aquatic lifestyle history"]
  },
  "gulmarg": {
    name: "Gulmarg", country: "India", state: "Jammu and Kashmir",
    landmarks: ["Gulmarg Gondola cable car", "St. Mary's Church"],
    neighborhoods: ["Gulmarg ski resort", "Ski slopes area"],
    food: ["Hotel-run restaurants serving Kashmiri and continental food", "Kahwa tea"],
    activities: ["Riding Asia highest cable car (Gulmarg Gondola)", "Skiing on Gulmarg slopes (winter)", "Visiting historic St. Mary's Church", "Hotel bar hangouts during ski season"],
    shopping: ["Small local stalls winter wear and papier-mache souvenirs"],
    culture: ["India premier winter sports skiing destination"]
  },
  "pahalgam": {
    name: "Pahalgam", country: "India", state: "Jammu and Kashmir",
    landmarks: ["Betaab Valley", "Aru Valley", "Chandanwari"],
    neighborhoods: ["Pahalgam market", "Lidder riverbank"],
    food: ["Local Kashmiri restaurants along the main market", "Fresh trout"],
    activities: ["Horseback riding in Betaab Valley", "Walking Lidder River banks", "Trekking Aru Valley scenic trails", "Camping by river"],
    shopping: ["Small local handicraft and shawl stalls in main market"],
    culture: ["Amarnath Yatra pilgrimage base camp", "Kashmiri alpine meadow landscape"]
  },
  "jammu": {
    name: "Jammu", country: "India", state: "Jammu and Kashmir",
    landmarks: ["Vaishno Devi Temple cave shrine", "Raghunath Temple", "Bahu Fort"],
    neighborhoods: ["Raghunath Bazaar", "Residency Road"],
    food: ["Krishna Dhaba vegetarian", "Local rajma-chawal food stalls"],
    activities: ["Trekking to Katra Vaishno Devi Temple cave", "Paying respects at Raghunath Temple", "Exploring Bahu Fort gardens"],
    shopping: ["Raghunath Bazaar dry fruits and textiles", "Residency Road"],
    culture: ["Dogra dynasty history", "Major Hindu Vaishno Devi pilgrimage hub"]
  },

  // --- Ladakh ---
  "leh": {
    name: "Leh", country: "India", state: "Ladakh",
    landmarks: ["Leh Palace", "Thiksey Monastery", "Shanti Stupa", "Magnetic Hill", "Hall of Fame war memorial"],
    neighborhoods: ["Leh Main Bazaar", "Chanspa"],
    food: ["Tibetan Kitchen", "Gesmo Restaurant yak cheese pizza", "Bon Appetit", "Lamayuru Restaurant"],
    activities: ["Touring Leh Palace", "Paying respects at Shanti Stupa", "Climbing Thiksey Monastery multi-story complex", "Visiting Hall of Fame war museum", "Hanging out in cafes with live acoustic music"],
    shopping: ["Leh Main Bazaar Tibetan/Ladakhi handicrafts, pashmina, prayer wheels"],
    culture: ["High-altitude cold desert Buddhist heritage", "Tibetan-Ladakhi monastic architecture"]
  },
  "pangong lake": {
    name: "Pangong Lake", country: "India", state: "Ladakh",
    landmarks: ["Pangong Tso high-altitude lake"],
    neighborhoods: ["Spangmik camping sites", "Lukung"],
    food: ["Camp-run simple Ladakhi and Indian meals"],
    activities: ["Watching Pangong Lake change colors through the day", "Camping and stargazing by the lakeside"],
    shopping: ["Makeshift stalls selling local snacks and winter souvenirs"],
    culture: ["High-altitude endorheic lake (4,200m) extending into Tibet"]
  },
  "nubra valley": {
    name: "Nubra Valley", country: "India", state: "Ladakh",
    landmarks: ["Diskit Monastery Maitreya Buddha", "Hunder sand dunes"],
    neighborhoods: ["Diskit village", "Hunder sand dunes camp"],
    food: ["Local Ladakhi guesthouse meals", "Butter tea"],
    activities: ["Visiting Diskit Monastery giant Buddha statue", "Riding double-humped Bactrian camels on Hunder sand dunes", "Crossing Khardung La pass (highest motorable pass)"],
    shopping: ["Small local stalls in Diskit village selling woolens"],
    culture: ["Silk Route historical valley heritage", "Bactrian camel desert walks"]
  },

  // --- Andaman and Nicobar Islands ---
  "port blair": {
    name: "Port Blair", country: "India", state: "Andaman and Nicobar Islands",
    landmarks: ["Cellular Jail national memorial", "Ross Island ruins"],
    neighborhoods: ["Aberdeen Bazaar", "Phoenix Bay"],
    food: ["New Lighthouse Restaurant seafood", "Annapurna Cafe South Indian"],
    activities: ["Touring historic Cellular Jail prison cells", "Watching Cellular Jail Light & Sound show", "Taking boat to Ross Island reclaimed ruins"],
    shopping: ["Aberdeen Bazaar shell crafts and local wooden souvenirs"],
    culture: ["Indian freedom struggle heritage", "Ross Island British colonial ruins"]
  },
  "havelock island": {
    name: "Havelock Island", country: "India", state: "Andaman and Nicobar Islands",
    landmarks: ["Radhanagar Beach Beach No. 7", "Elephant Beach"],
    neighborhoods: ["Havelock Jetty area", "Radhanagar beach road"],
    food: ["Beachside shacks fresh seafood and Andaman lobster", "Local resort restaurants"],
    activities: ["Swimming at Radhanagar Beach (rated among Asia best)", "Snorkeling and scuba diving at Elephant Beach", "Resort bar beach bonfire nights"],
    shopping: ["Small local craft stalls near Havelock Jetty"],
    culture: ["World-class scuba diving and coral reef ecosystem"]
  },
  "neil island": {
    name: "Neil Island", country: "India", state: "Andaman and Nicobar Islands",
    landmarks: ["Natural Bridge rock formation", "Bharatpur Beach"],
    neighborhoods: ["Neil Jetty area", "Laxmanpur beach"],
    food: ["Beachside seafood shacks", "Fresh coconut water"],
    activities: ["Walking across the natural coral bridge formation", "Relaxing on quiet Bharatpur Beach", "Cycling around the small agricultural island"],
    shopping: ["Small local stalls selling shell crafts"],
    culture: ["Laid-back, quiet island alternative to Havelock"]
  },

  // --- Dadra and Nagar Haveli and Daman and Diu ---
  "diu": {
    name: "Diu", country: "India", state: "Dadra and Nagar Haveli and Daman and Diu",
    landmarks: ["Diu Fort Portuguese fortress", "St. Paul's Church", "Naida Caves"],
    neighborhoods: ["Diu town", "Nagoa beach"],
    food: ["Coastal shacks Diu fish curry", "Goan-Portuguese influenced seafood"],
    activities: ["Exploring historic Diu Fort", "Touring St. Paul's Church", "Exploring Naida Caves light beams", "Hanging out in beach shacks and bars (Diu is duty-free)"],
    shopping: ["Diu town bazaar local handicrafts and seafood"],
    culture: ["Portuguese colonial architecture enclave heritage"]
  },
  "daman": {
    name: "Daman", country: "India", state: "Dadra and Nagar Haveli and Daman and Diu",
    landmarks: ["Moti Daman Fort", "Jampore Beach"],
    neighborhoods: ["Moti Daman", "Nani Daman", "Jampore Beach road"],
    food: ["Coastal seafood restaurants along Jampore Beach", "Local fish fry"],
    activities: ["Exploring old Moti Daman Fort", "Walking along black sand Jampore Beach", "Relaxing in beach shacks and bars"],
    shopping: ["Local seafood and produce markets near the fort"],
    culture: ["Portuguese enclave history until 1961"]
  },
  "silvassa": {
    name: "Silvassa", country: "India", state: "Dadra and Nagar Haveli and Daman and Diu",
    landmarks: ["Vasona Lion Safari Park", "Silvassa tribal museum"],
    neighborhoods: ["Silvassa town", "Vasona"],
    food: ["Local Gujarati-influenced restaurants"],
    activities: ["Taking lion safari in Vasona Park", "Exploring Silvassa tribal museum detailing Warli culture"],
    shopping: ["Local tribal handicraft stalls Warli paintings and wood carvings"],
    culture: ["Warli tribal heritage", "Quiet inland wooded town scenery"]
  },

  // --- Lakshadweep ---
  "agatti island": {
    name: "Agatti Island", country: "India", state: "Lakshadweep",
    landmarks: ["Agatti coral lagoon"],
    neighborhoods: ["Agatti airport area", "Agatti beach"],
    food: ["Local island eateries coconut-based seafood curries, Tuna dishes"],
    activities: ["Snorkeling in Agatti coral lagoon", "Kayaking and beach volleyball", "Bicycling around the narrow coral island"],
    shopping: ["Very limited local markets coconut shell crafts"],
    culture: ["Eco-sensitive Islamic island culture heritage"]
  },
  "bangaram island": {
    name: "Bangaram Island", country: "India", state: "Lakshadweep",
    landmarks: ["Bangaram uninhabited lagoon"],
    neighborhoods: ["Bangaram resort area"],
    food: ["Resort-run seafood dining buffet style"],
    activities: ["Scuba diving and deep sea snorkeling in crystal clear lagoon", "Kayaking around uninhabited sandbanks"],
    shopping: ["None uninhabited resort island"],
    culture: ["Pristine coral atoll ecosystem conservation"]
  },
  "kavaratti": {
    name: "Kavaratti", country: "India", state: "Lakshadweep",
    landmarks: ["Kavaratti coral reefs", "Ujra Mosque"],
    neighborhoods: ["Kavaratti town", "Marine aquarium area"],
    food: ["Local island eateries Mus Kavab, coconut-based curries"],
    activities: ["Glass-bottom boat rides over coral reefs", "Visiting Ujra Mosque (famous for driftwood carvings)", "Exploring Marine Aquarium"],
    shopping: ["Small local markets for daily essentials"],
    culture: ["Capital of Lakshadweep Union Territory"]
  },

  // --- Puducherry ---
  "puducherry": {
    name: "Puducherry", country: "India", state: "Puducherry",
    landmarks: ["Promenade Beach Rock Beach", "French Quarter White Town", "Sri Aurobindo Ashram"],
    neighborhoods: ["French Quarter", "Tamil Quarter", "Mission Street", "Jawaharlal Nehru Street"],
    food: ["Cafe des Arts French quarter", "Surguru South Indian vegetarian", "Le Cafe beachfront", "Baker Street French pastries"],
    activities: ["Walking the French Quarter White Town lanes", "Visiting Sri Aurobindo Ashram", "Strolling Promenade Beach at sunset", "Hanging out at relaxed French-Quarter cafes and beachfront bars"],
    shopping: ["Mission Street and JN Street boutiques perfumes, handmade paper"],
    culture: ["Former French colony layout", "French-Tamil fusion gastronomy"]
  },
  "auroville": {
    name: "Auroville", country: "India", state: "Puducherry",
    landmarks: ["Matrimandir golden geodesic dome"],
    neighborhoods: ["Auroville visitor center", "Auroville cafes"],
    food: ["Auroville cafes serving organic, internationally-influenced food"],
    activities: ["Viewing the golden Matrimandir dome", "Learning about the international township concept", "Walking the peaceful forested paths"],
    shopping: ["Auroville boutique shops organic perfumes, handmade soaps, clothing"],
    culture: ["International experimental township founded on human unity principles"]
  }
};

// Add / Overwrite cities in database
for (const [key, city] of Object.entries(encyclopediaCities)) {
  cities[key] = city;
}

// Update India regions to map correctly to all these cities
const statesToCities = {};
for (const [key, city] of Object.entries(encyclopediaCities)) {
  const stateKey = city.state.toLowerCase().trim();
  if (!statesToCities[stateKey]) {
    statesToCities[stateKey] = {
      name: city.state,
      country: "India",
      cities: []
    };
  }
  statesToCities[stateKey].cities.push(city.name);
}

// Merge state regions into database
for (const [key, reg] of Object.entries(statesToCities)) {
  regions[key] = reg;
}

// Ensure India region maps to a select set of major hubs
regions["india"] = {
  name: "India",
  country: "India",
  cities: ["New Delhi", "Mumbai", "Bengaluru", "Kolkata", "Jaipur", "Goa", "Kochi", "Chennai"]
};

// Write out the merged database
db.cities = cities;
db.regions = regions;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log("SUCCESSFULLY integrated India Travel Encyclopedia!");
console.log(`Updated database contains ${Object.keys(db.cities).length} cities and ${Object.keys(db.regions).length} regions.`);
