export const CATEGORIES = [
  "All", "Plumber", "Electrician", "Carpenter", "Painter", "Welder", "Mason",
  "AC Technician", "Home Cleaner", "Driver", "Security Guard", "Cook",
  "Gardener", "Pest Control", "Helper", "Fabricator", "Tile Worker",
  "Roofer", "HVAC Technician"
];

export const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
  "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
  "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad",
  "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
  "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
  "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Jabalpur", "Gwalior",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh",
  "Solapur", "Hubli-Dharwad", "Bareilly", "Moradabad", "Mysore", "Gurgaon",
  "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar",
  "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner",
  "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi",
  "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded",
  "Kolhapur", "Ajmer", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri",
  "Jhansi", "Ulhasnagar", "Jammu", "Sangli", "Mangalore", "Belgaum", "Ambattur",
  "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala",
  "Tirupati", "Anantapur", "Kurnool", "Kadapa", "Kakinada", "Rajahmundry", "Eluru", "Vizianagaram",
  "Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Hamirpur",
  "Rishikesh", "Haridwar", "Roorkee", "Haldwani", "Kashipur",
  "Bathinda", "Patiala", "Mohali", "Pathankot", "Hoshiarpur",
  "Rohtak", "Hisar", "Panipat", "Karnal", "Sonipat", "Panchkula", "Ambala",
  "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali",
  "Muzaffarpur", "Bhagalpur", "Bihar Sharif", "Darbhanga", "Arrah", "Begusarai",
  "Bilaspur", "Korba", "Durg", "Rajnandgaon",
  "Ahmednagar", "Akola", "Latur", "Dhule", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna",
  "Anand", "Gandhinagar", "Jamnagar", "Junagadh", "Bharuch", "Navsari", "Morbi",
  "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi",
  "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Kalaburagi",
  "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Mandya"
].sort((a, b) => a.localeCompare(b));

export type Region = "North" | "South" | "West" | "East" | "Central" | "Karnataka";

export const CITY_REGION_MAP: Record<string, Region> = {
  // West
  "Mumbai": "West", "Pune": "West", "Ahmedabad": "West", "Surat": "West", "Nagpur": "West", "Thane": "West", "Nashik": "West", "Rajkot": "West", "Kalyan-Dombivli": "West", "Vasai-Virar": "West", "Aurangabad": "West", "Navi Mumbai": "West", "Solapur": "West", "Bhavnagar": "West", "Mira-Bhayandar": "West", "Bhiwandi": "West", "Amravati": "West", "Kolhapur": "West", "Jamnagar": "West", "Malegaon": "West", "Jalgaon": "West", "Sangli": "West", "Ahmednagar": "West", "Akola": "West", "Latur": "West", "Dhule": "West", "Chandrapur": "West", "Parbhani": "West", "Ichalkaranji": "West", "Jalna": "West", "Anand": "West", "Gandhinagar": "West", "Junagadh": "West", "Bharuch": "West", "Navsari": "West", "Morbi": "West",

  // North
  "Delhi": "North", "Jaipur": "North", "Lucknow": "North", "Kanpur": "North", "Ghaziabad": "North", "Ludhiana": "North", "Agra": "North", "Faridabad": "North", "Meerut": "North", "Varanasi": "North", "Srinagar": "North", "Amritsar": "North", "Allahabad": "North", "Jodhpur": "North", "Kota": "North", "Chandigarh": "North", "Bareilly": "North", "Moradabad": "North", "Gurgaon": "North", "Aligarh": "North", "Jalandhar": "North", "Saharanpur": "North", "Gorakhpur": "North", "Bikaner": "North", "Noida": "North", "Firozabad": "North", "Dehradun": "North", "Ajmer": "North", "Ujjain": "North", "Jhansi": "North", "Jammu": "North", "Gaya": "North", "Udaipur": "North", "Shimla": "North", "Manali": "North", "Dharamshala": "North", "Solan": "North", "Mandi": "North", "Hamirpur": "North", "Rishikesh": "North", "Haridwar": "North", "Roorkee": "North", "Haldwani": "North", "Kashipur": "North", "Bathinda": "North", "Patiala": "North", "Mohali": "North", "Pathankot": "North", "Hoshiarpur": "North", "Rohtak": "North", "Hisar": "North", "Panipat": "North", "Karnal": "North", "Sonipat": "North", "Panchkula": "North", "Ambala": "North", "Bhilwara": "North", "Alwar": "North", "Bharatpur": "North", "Sikar": "North", "Pali": "North",

  // South
  "Hyderabad": "South", "Chennai": "South", "Visakhapatnam": "South", "Vijayawada": "South", "Madurai": "South", "Tiruchirappalli": "South", "Salem": "South", "Warangal": "South", "Guntur": "South", "Kochi": "South", "Nellore": "South", "Nanded": "South", "Tirupati": "South", "Anantapur": "South", "Kurnool": "South", "Kadapa": "South", "Kakinada": "South", "Rajahmundry": "South", "Eluru": "South", "Vizianagaram": "South", "Vellore": "South", "Erode": "South", "Thoothukudi": "South", "Dindigul": "South", "Thanjavur": "South", "Ranipet": "South", "Sivakasi": "South", "Nizamabad": "South", "Khammam": "South", "Karimnagar": "South", "Ramagundam": "South", "Mahbubnagar": "South",

  // Karnataka Specific
  "Bangalore": "Karnataka", "Mandya": "Karnataka", "Mysore": "Karnataka", "Mysuru": "Karnataka", "Hubli-Dharwad": "Karnataka", "Hubballi": "Karnataka", "Mangalore": "Karnataka", "Mangaluru": "Karnataka", "Belgaum": "Karnataka", "Belagavi": "Karnataka", "Gulbarga": "Karnataka", "Kalaburagi": "Karnataka", "Ballari": "Karnataka", "Vijayapura": "Karnataka", "Shivamogga": "Karnataka", "Tumakuru": "Karnataka",

  // East
  "Kolkata": "East", "Patna": "East", "Dhanbad": "East", "Ranchi": "East", "Howrah": "East", "Guwahati": "East", "Bhubaneswar": "East", "Jamshedpur": "East", "Cuttack": "East", "Durgapur": "East", "Asansol": "East", "Rourkela": "East", "Siliguri": "East", "Maheshtala": "East", "Muzaffarpur": "East", "Bhagalpur": "East", "Bihar Sharif": "East", "Darbhanga": "East", "Arrah": "East", "Begusarai": "East",

  // Central
  "Indore": "Central", "Bhopal": "Central", "Jabalpur": "Central", "Gwalior": "Central", "Raipur": "Central", "Bhilai": "Central", "Bilaspur": "Central", "Korba": "Central", "Durg": "Central", "Rajnandgaon": "Central"
};

export const REGIONAL_NAMES: Record<Region, { maleFirst: string[], femaleFirst: string[], last: string[] }> = {
  North: {
    maleFirst: ["Rajesh", "Amit", "Vikram", "Sunil", "Deepak", "Manoj", "Anil", "Karan", "Ajay", "Sandeep", "Rahul", "Sanjay", "Vinod", "Pankaj", "Ashok", "Suresh", "Rakesh", "Mohit", "Tarun", "Varun", "Arun", "Jitender", "Yogesh", "Satish", "Devender", "Manish", "Gaurav", "Harish", "Lokesh", "Naveen", "Omprakash", "Pradeep", "Qasim", "Rishi", "Tushar", "Umesh", "Vicky", "Waseem", "Xavier", "Yusuf", "Zaid", "Balraj", "Jaswinder", "Gurmukh", "Kuldeep"],
    femaleFirst: ["Sunita", "Anita", "Pooja", "Meena", "Rani", "Kiran", "Sonia", "Kavita", "Rekha", "Babita", "Geeta", "Seema", "Ritu", "Preeti", "Deepa", "Jyoti", "Asha", "Usha", "Mamta", "Neelam", "Sheetal", "Anjali", "Swati", "Nisha", "Shalini"],
    last: ["Singh", "Sharma", "Verma", "Gupta", "Yadav", "Chauhan", "Kumar", "Mishra", "Pandey", "Rajput", "Tyagi", "Bhardwaj", "Kapoor", "Malhotra", "Khanna", "Mehra", "Chopra", "Dutta", "Sethi", "Bansal", "Goel", "Aggarwal", "Bakshi", "Dhillon", "Gill", "Sandhu", "Grewal", "Sidhu"]
  },
  South: {
    maleFirst: ["Srinivas", "Venkatesh", "Arjun", "Karthik", "Ramesh", "Suresh", "Ravi", "Vijay", "Mohan", "Naveen", "Madhav", "Sai", "Kiran", "Prashanth", "Harish", "Anand", "Bala", "Chandra", "Dinesh", "Eshwar", "Ganesh", "Ibrahim", "Jagdish", "Laxman", "Mani", "Narayan", "Prabhu", "Raghu", "Shekar", "Thirupathi", "Uday", "Vishnu", "Yashwanth", "Zubair", "Aravind", "Bhaskar", "Chethan", "Damodar", "Elango", "Faizal", "Hemant", "Ishwar", "Janardhan", "Koteswara", "Lingam"],
    femaleFirst: ["Lakshmi", "Saraswathi", "Parvathi", "Anitha", "Deepika", "Kavitha", "Priya", "Sandhya", "Radha", "Meenakshi", "Gayatri", "Vidya", "Sujatha", "Vani", "Shanthi", "Uma", "Indira", "Kamala", "Latha", "Bhagya", "Jyothi", "Rajani"],
    last: ["Reddy", "Rao", "Naidu", "Goud", "Murthy", "Iyer", "Nair", "Pillai", "Prasad", "Subramanian", "Balaji", "Krishnan", "Menon", "Raju", "Varma", "Chary", "Swamy", "Achari", "Bhat", "Shenoy", "Kamat", "Pai", "D'Souza", "Mudaliar", "Chettiar", "Annamalai"]
  },
  Karnataka: {
    maleFirst: ["Shivanna", "Boregowda", "Siddegowda", "Mallesh", "Basappa", "Kempanna", "Rangappa", "Doddanna", "Channappa", "Krishnappa", "Marigowda", "Devegowda", "Puttaswamy", "Manjunath", "Chandrashekar", "Kumar", "Swamy", "Harish", "Prakash", "Nagesh", "Ravi", "Srinivasa", "Mahesh", "Suresh", "Lokesh", "Ningappa", "Sidda", "Thimme", "Kempu", "Malla"],
    femaleFirst: ["Manjula", "Parvathamma", "Gowramma", "Shanthamma", "Ratnamma", "Nethravathi", "Pushpa", "Bhagya", "Sudha", "Savitha", "Girija", "Kavya", "Deepa", "Rekha", "Roopa", "Ashwini", "Jyothi", "Lakshmi", "Saraswathi", "Vimala"],
    last: ["Gowda", "Nayaka", "Shetty", "Urs", "Bhat", "Hegde", "Rao", "Patil", "Hiremath", "Kulkarni", "Deshpande", "Angadi", "Jarkiholi", "Achar", "Poojari", "Moolya", "Rai"]
  },
  West: {
    maleFirst: ["Vinayak", "Amol", "Nilesh", "Swapnil", "Parag", "Tushar", "Saurabh", "Aditya", "Pratik", "Harsh", "Ganesh", "Mahesh", "Siddharth", "Abhijit", "Bharat", "Chetan", "Dhananjay", "Eknath", "Gajanan", "Hemant", "Ishwar", "Jayesh", "Kishor", "Laxmikant", "Milind", "Nitin", "Omkar", "Pramod", "Rohan", "Shailesh", "Tanmay", "Uday", "Vivek", "Yogesh", "Amrut", "Baban", "Chandrakant", "Deepak", "Eshant"],
    femaleFirst: ["Ashwini", "Sneha", "Pranali", "Vaishali", "Manisha", "Shital", "Priyanka", "Deepali", "Kavita", "Anjali", "Sushma", "Rekha", "Usha", "Alka", "Varsha", "Neeta", "Sarika", "Madhuri", "Jyoti", "Pallavi", "Reshma", "Surekha"],
    last: ["Patil", "Deshmukh", "Kulkarni", "Chavan", "More", "Joshi", "Shah", "Mehta", "Patel", "Desai", "Gaikwad", "Shinde", "Pawar", "Kadam", "Sawant", "Thorat", "Bhosale", "Waghmare", "Kamble", "Shende", "Tambe", "Zende", "Gadkari", "Fadnavis", "Thackeray"]
  },
  East: {
    maleFirst: ["Abhijit", "Subhash", "Anirban", "Debashis", "Arnab", "Biplab", "Tapas", "Sanjay", "Nirmal", "Sourav", "Prabhat", "Rahul", "Joy", "Amitav", "Bimal", "Chandan", "Dulal", "Gautam", "Himadri", "Indranil", "Jyoti", "Kalyan", "Laltu", "Mridul", "Naba", "Pallab", "Ratan", "Sajal", "Tarun", "Utpal", "Uttam", "Bapi", "Khokan", "Santu", "Pintu", "Montu", "Guddu", "Bablu", "Toton"],
    femaleFirst: ["Srabani", "Mousumi", "Payel", "Soma", "Rina", "Jhuma", "Anjali", "Sampa", "Bulu", "Tultul", "Ritu", "Piyali", "Debarati", "Susmita", "Mitali", "Lipika", "Tandra", "Gopa", "Aparna", "Runu"],
    last: ["Banerjee", "Chatterjee", "Mukherjee", "Das", "Roy", "Sen", "Majumdar", "Bose", "Ghosh", "Mahapatra", "Prasad", "Sinha", "Sarkar", "Dutta", "Pal", "Mondal", "Pramanik", "Basu", "Guha", "Chowdhury", "Bhattacharya", "Chakraborty", "Naskar", "Haldar"]
  },
  Central: {
    maleFirst: ["Rajesh", "Amit", "Alok", "Sunil", "Deepak", "Manoj", "Anil", "Karan", "Ajay", "Sandeep", "Rahul", "Sanjay", "Prakash", "Ashish", "Brajesh", "Chhotelal", "Dheeraj", "Golu", "Hiralal", "Jagdish", "Kamal", "Lalit", "Munna", "Neeraj", "Omji", "Pushpendra", "Ram", "Shyam", "Tikam", "Umesh", "Vishal"],
    femaleFirst: ["Sunita", "Anita", "Pooja", "Meena", "Rani", "Kiran", "Sonia", "Kavita", "Rekha", "Babita", "Geeta", "Seema", "Ritu", "Preeti", "Deepa", "Jyoti", "Asha", "Usha", "Mamta", "Neelam"],
    last: ["Singh", "Sharma", "Verma", "Gupta", "Yadav", "Chauhan", "Kumar", "Mishra", "Pandey", "Tiwari", "Shrivastava", "Dubey", "Rathore", "Tomar", "Baghel", "Kushwaha", "Lodhi", "Parihar", "Sahu", "Patidar", "Jain", "Brahman", "Thakur"]
  }
};
