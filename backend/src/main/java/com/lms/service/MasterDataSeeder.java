package com.lms.service;

import com.lms.entity.City;
import com.lms.entity.Country;
import com.lms.entity.StateMaster;
import com.lms.repository.CityRepository;
import com.lms.repository.CountryRepository;
import com.lms.repository.StateMasterRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * MasterDataSeeder — seeds cities, states, and countries into DB on first startup.
 * Checks count before inserting — safe to restart without duplicates.
 */
@Component
public class MasterDataSeeder {

    private final CityRepository cityRepo;
    private final StateMasterRepository stateRepo;
    private final CountryRepository countryRepo;

    public MasterDataSeeder(CityRepository cityRepo,
                            StateMasterRepository stateRepo,
                            CountryRepository countryRepo) {
        this.cityRepo = cityRepo;
        this.stateRepo = stateRepo;
        this.countryRepo = countryRepo;
    }

    @PostConstruct
    public void seed() {
        seedStates();
        seedCities();
        seedCountries();
        addMissingCityAliases(); // migration: add popular alternate names
    }

    /**
     * Migration: adds popular alternate city names if not already present.
     * Safe to run every startup — checks existence before insert.
     */
    private void addMissingCityAliases() {
        // Only add city names that don't exist at all in the DB.
        // Do NOT add "Bangalore" — DB already has "Bengaluru" (official name).
        // Alias matching for Bangalore ↔ Bengaluru is handled on the frontend.
        java.util.Map<String, String> aliases = new java.util.LinkedHashMap<>();
        // Old names still widely used that may not be in DB
        aliases.put("Bombay", "Maharashtra");
        aliases.put("Calcutta", "West Bengal");
        aliases.put("Madras", "Tamil Nadu");
        aliases.put("Poona", "Maharashtra");

        for (java.util.Map.Entry<String, String> entry : aliases.entrySet()) {
            String name = entry.getKey();
            String state = entry.getValue();
            boolean exists = cityRepo.findAllNames().stream()
                .anyMatch(c -> c.equalsIgnoreCase(name));
            if (!exists) {
                cityRepo.save(new City(name, state));
                System.out.println("MASTER_DATA: Added alias city → " + name + " (" + state + ")");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATES — 28 States + 8 Union Territories of India
    // ─────────────────────────────────────────────────────────────────────────
    private void seedStates() {
        if (stateRepo.count() > 0) return;
        List<StateMaster> states = Arrays.asList(
            // States
            new StateMaster("Andhra Pradesh"),
            new StateMaster("Arunachal Pradesh"),
            new StateMaster("Assam"),
            new StateMaster("Bihar"),
            new StateMaster("Chhattisgarh"),
            new StateMaster("Goa"),
            new StateMaster("Gujarat"),
            new StateMaster("Haryana"),
            new StateMaster("Himachal Pradesh"),
            new StateMaster("Jharkhand"),
            new StateMaster("Karnataka"),
            new StateMaster("Kerala"),
            new StateMaster("Madhya Pradesh"),
            new StateMaster("Maharashtra"),
            new StateMaster("Manipur"),
            new StateMaster("Meghalaya"),
            new StateMaster("Mizoram"),
            new StateMaster("Nagaland"),
            new StateMaster("Odisha"),
            new StateMaster("Punjab"),
            new StateMaster("Rajasthan"),
            new StateMaster("Sikkim"),
            new StateMaster("Tamil Nadu"),
            new StateMaster("Telangana"),
            new StateMaster("Tripura"),
            new StateMaster("Uttar Pradesh"),
            new StateMaster("Uttarakhand"),
            new StateMaster("West Bengal"),
            // Union Territories
            new StateMaster("Andaman and Nicobar Islands"),
            new StateMaster("Chandigarh"),
            new StateMaster("Dadra and Nagar Haveli and Daman and Diu"),
            new StateMaster("Delhi"),
            new StateMaster("Jammu and Kashmir"),
            new StateMaster("Ladakh"),
            new StateMaster("Lakshadweep"),
            new StateMaster("Puducherry")
        );
        stateRepo.saveAll(states);
        System.out.println("MASTER_DATA: Seeded " + states.size() + " states/UTs");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CITIES — ~500 major Indian cities across all states
    // ─────────────────────────────────────────────────────────────────────────
    private void seedCities() {
        if (cityRepo.count() > 0) return;
        List<City> cities = Arrays.asList(
            // Andhra Pradesh
            new City("Visakhapatnam","Andhra Pradesh"), new City("Vijayawada","Andhra Pradesh"),
            new City("Guntur","Andhra Pradesh"), new City("Nellore","Andhra Pradesh"),
            new City("Kurnool","Andhra Pradesh"), new City("Rajahmundry","Andhra Pradesh"),
            new City("Tirupati","Andhra Pradesh"), new City("Kakinada","Andhra Pradesh"),
            new City("Kadapa","Andhra Pradesh"), new City("Anantapur","Andhra Pradesh"),
            new City("Eluru","Andhra Pradesh"), new City("Ongole","Andhra Pradesh"),
            new City("Nandyal","Andhra Pradesh"), new City("Machilipatnam","Andhra Pradesh"),
            new City("Vizianagaram","Andhra Pradesh"), new City("Proddatur","Andhra Pradesh"),
            new City("Chittoor","Andhra Pradesh"), new City("Bhimavaram","Andhra Pradesh"),
            new City("Srikakulam","Andhra Pradesh"), new City("Tenali","Andhra Pradesh"),
            new City("Tadepalligudem","Andhra Pradesh"), new City("Hindupur","Andhra Pradesh"),
            new City("Adoni","Andhra Pradesh"), new City("Amaravati","Andhra Pradesh"),
            new City("Narasaraopet","Andhra Pradesh"), new City("Kavali","Andhra Pradesh"),

            // Arunachal Pradesh
            new City("Itanagar","Arunachal Pradesh"), new City("Naharlagun","Arunachal Pradesh"),
            new City("Pasighat","Arunachal Pradesh"), new City("Tawang","Arunachal Pradesh"),
            new City("Bomdila","Arunachal Pradesh"),

            // Assam
            new City("Guwahati","Assam"), new City("Silchar","Assam"),
            new City("Dibrugarh","Assam"), new City("Jorhat","Assam"),
            new City("Nagaon","Assam"), new City("Tinsukia","Assam"),
            new City("Tezpur","Assam"), new City("Bongaigaon","Assam"),
            new City("Dhubri","Assam"), new City("Karimganj","Assam"),
            new City("Sivasagar","Assam"), new City("Goalpara","Assam"),
            new City("Barpeta","Assam"), new City("North Lakhimpur","Assam"),
            new City("Diphu","Assam"), new City("Haflong","Assam"),

            // Bihar
            new City("Patna","Bihar"), new City("Gaya","Bihar"),
            new City("Bhagalpur","Bihar"), new City("Muzaffarpur","Bihar"),
            new City("Darbhanga","Bihar"), new City("Arrah","Bihar"),
            new City("Begusarai","Bihar"), new City("Katihar","Bihar"),
            new City("Munger","Bihar"), new City("Chhapra","Bihar"),
            new City("Purnia","Bihar"), new City("Samastipur","Bihar"),
            new City("Bihar Sharif","Bihar"), new City("Hajipur","Bihar"),
            new City("Sasaram","Bihar"), new City("Sitamarhi","Bihar"),
            new City("Motihari","Bihar"), new City("Bettiah","Bihar"),
            new City("Siwan","Bihar"), new City("Dehri","Bihar"),
            new City("Aurangabad","Bihar"), new City("Nawada","Bihar"),
            new City("Jehanabad","Bihar"), new City("Kishanganj","Bihar"),

            // Chhattisgarh
            new City("Raipur","Chhattisgarh"), new City("Bhilai","Chhattisgarh"),
            new City("Bilaspur","Chhattisgarh"), new City("Korba","Chhattisgarh"),
            new City("Durg","Chhattisgarh"), new City("Rajnandgaon","Chhattisgarh"),
            new City("Jagdalpur","Chhattisgarh"), new City("Raigarh","Chhattisgarh"),
            new City("Ambikapur","Chhattisgarh"), new City("Mahasamund","Chhattisgarh"),
            new City("Dhamtari","Chhattisgarh"), new City("Chhatarpur","Chhattisgarh"),

            // Goa
            new City("Panaji","Goa"), new City("Margao","Goa"),
            new City("Vasco da Gama","Goa"), new City("Mapusa","Goa"),
            new City("Ponda","Goa"), new City("Bicholim","Goa"),

            // Gujarat
            new City("Ahmedabad","Gujarat"), new City("Surat","Gujarat"),
            new City("Vadodara","Gujarat"), new City("Rajkot","Gujarat"),
            new City("Bhavnagar","Gujarat"), new City("Jamnagar","Gujarat"),
            new City("Gandhinagar","Gujarat"), new City("Junagadh","Gujarat"),
            new City("Anand","Gujarat"), new City("Navsari","Gujarat"),
            new City("Morbi","Gujarat"), new City("Nadiad","Gujarat"),
            new City("Surendranagar","Gujarat"), new City("Bharuch","Gujarat"),
            new City("Mehsana","Gujarat"), new City("Porbandar","Gujarat"),
            new City("Godhra","Gujarat"), new City("Palanpur","Gujarat"),
            new City("Valsad","Gujarat"), new City("Amreli","Gujarat"),
            new City("Dahod","Gujarat"), new City("Botad","Gujarat"),
            new City("Kheda","Gujarat"), new City("Patan","Gujarat"),
            new City("Veraval","Gujarat"), new City("Gandhidham","Gujarat"),
            new City("Ankleshwar","Gujarat"), new City("Wadhwan","Gujarat"),

            // Haryana
            new City("Faridabad","Haryana"), new City("Gurugram","Haryana"),
            new City("Panipat","Haryana"), new City("Ambala","Haryana"),
            new City("Yamunanagar","Haryana"), new City("Rohtak","Haryana"),
            new City("Hisar","Haryana"), new City("Karnal","Haryana"),
            new City("Sonipat","Haryana"), new City("Panchkula","Haryana"),
            new City("Bhiwani","Haryana"), new City("Sirsa","Haryana"),
            new City("Bahadurgarh","Haryana"), new City("Jind","Haryana"),
            new City("Thanesar","Haryana"), new City("Kaithal","Haryana"),
            new City("Rewari","Haryana"), new City("Palwal","Haryana"),
            new City("Fatehabad","Haryana"), new City("Nuh","Haryana"),

            // Himachal Pradesh
            new City("Shimla","Himachal Pradesh"), new City("Solan","Himachal Pradesh"),
            new City("Dharamsala","Himachal Pradesh"), new City("Mandi","Himachal Pradesh"),
            new City("Palampur","Himachal Pradesh"), new City("Baddi","Himachal Pradesh"),
            new City("Nahan","Himachal Pradesh"), new City("Kullu","Himachal Pradesh"),
            new City("Hamirpur","Himachal Pradesh"), new City("Una","Himachal Pradesh"),
            new City("Bilaspur","Himachal Pradesh"), new City("Chamba","Himachal Pradesh"),
            new City("Manali","Himachal Pradesh"), new City("Kangra","Himachal Pradesh"),

            // Jharkhand
            new City("Jamshedpur","Jharkhand"), new City("Dhanbad","Jharkhand"),
            new City("Ranchi","Jharkhand"), new City("Bokaro","Jharkhand"),
            new City("Deoghar","Jharkhand"), new City("Hazaribagh","Jharkhand"),
            new City("Giridih","Jharkhand"), new City("Ramgarh","Jharkhand"),
            new City("Phusro","Jharkhand"), new City("Adityapur","Jharkhand"),
            new City("Chas","Jharkhand"), new City("Medininagar","Jharkhand"),
            new City("Chaibasa","Jharkhand"), new City("Dumka","Jharkhand"),

            // Karnataka
            new City("Bengaluru","Karnataka"), new City("Mysuru","Karnataka"),
            new City("Hubballi","Karnataka"), new City("Dharwad","Karnataka"),
            new City("Mangaluru","Karnataka"), new City("Belagavi","Karnataka"),
            new City("Davanagere","Karnataka"), new City("Ballari","Karnataka"),
            new City("Vijayapura","Karnataka"), new City("Shivamogga","Karnataka"),
            new City("Tumakuru","Karnataka"), new City("Raichur","Karnataka"),
            new City("Bidar","Karnataka"), new City("Kalaburagi","Karnataka"),
            new City("Hassan","Karnataka"), new City("Udupi","Karnataka"),
            new City("Gadag","Karnataka"), new City("Mandya","Karnataka"),
            new City("Chikkamagaluru","Karnataka"), new City("Chitradurga","Karnataka"),
            new City("Bagalkot","Karnataka"), new City("Kolar","Karnataka"),
            new City("Hospete","Karnataka"), new City("Gangavati","Karnataka"),
            new City("Robertsonpet","Karnataka"), new City("Bhadravati","Karnataka"),

            // Kerala
            new City("Thiruvananthapuram","Kerala"), new City("Kochi","Kerala"),
            new City("Kozhikode","Kerala"), new City("Thrissur","Kerala"),
            new City("Kollam","Kerala"), new City("Palakkad","Kerala"),
            new City("Alappuzha","Kerala"), new City("Malappuram","Kerala"),
            new City("Kottayam","Kerala"), new City("Kannur","Kerala"),
            new City("Kasaragod","Kerala"), new City("Pathanamthitta","Kerala"),
            new City("Manjeri","Kerala"), new City("Thalassery","Kerala"),
            new City("Perinthalmanna","Kerala"), new City("Ponnani","Kerala"),
            new City("Chalakudy","Kerala"), new City("Irinjalakuda","Kerala"),
            new City("Kunnamkulam","Kerala"), new City("Guruvayur","Kerala"),

            // Madhya Pradesh
            new City("Indore","Madhya Pradesh"), new City("Bhopal","Madhya Pradesh"),
            new City("Jabalpur","Madhya Pradesh"), new City("Gwalior","Madhya Pradesh"),
            new City("Ujjain","Madhya Pradesh"), new City("Sagar","Madhya Pradesh"),
            new City("Dewas","Madhya Pradesh"), new City("Satna","Madhya Pradesh"),
            new City("Ratlam","Madhya Pradesh"), new City("Rewa","Madhya Pradesh"),
            new City("Singrauli","Madhya Pradesh"), new City("Burhanpur","Madhya Pradesh"),
            new City("Khandwa","Madhya Pradesh"), new City("Bhind","Madhya Pradesh"),
            new City("Chhindwara","Madhya Pradesh"), new City("Guna","Madhya Pradesh"),
            new City("Shivpuri","Madhya Pradesh"), new City("Vidisha","Madhya Pradesh"),
            new City("Chhatarpur","Madhya Pradesh"), new City("Mandsaur","Madhya Pradesh"),
            new City("Khargone","Madhya Pradesh"), new City("Neemuch","Madhya Pradesh"),
            new City("Pithampur","Madhya Pradesh"), new City("Hoshangabad","Madhya Pradesh"),
            new City("Itarsi","Madhya Pradesh"), new City("Morena","Madhya Pradesh"),
            new City("Datia","Madhya Pradesh"), new City("Damoh","Madhya Pradesh"),

            // Maharashtra
            new City("Mumbai","Maharashtra"), new City("Pune","Maharashtra"),
            new City("Nagpur","Maharashtra"), new City("Nashik","Maharashtra"),
            new City("Chhatrapati Sambhajinagar","Maharashtra"), new City("Solapur","Maharashtra"),
            new City("Amravati","Maharashtra"), new City("Navi Mumbai","Maharashtra"),
            new City("Thane","Maharashtra"), new City("Kolhapur","Maharashtra"),
            new City("Latur","Maharashtra"), new City("Dhule","Maharashtra"),
            new City("Ahmednagar","Maharashtra"), new City("Chandrapur","Maharashtra"),
            new City("Parbhani","Maharashtra"), new City("Jalgaon","Maharashtra"),
            new City("Akola","Maharashtra"), new City("Nanded","Maharashtra"),
            new City("Sangli","Maharashtra"), new City("Satara","Maharashtra"),
            new City("Ratnagiri","Maharashtra"), new City("Jalna","Maharashtra"),
            new City("Panvel","Maharashtra"), new City("Vasai","Maharashtra"),
            new City("Bhiwandi","Maharashtra"), new City("Shirdi","Maharashtra"),
            new City("Malegaon","Maharashtra"), new City("Kalyan","Maharashtra"),
            new City("Dombivli","Maharashtra"), new City("Ulhasnagar","Maharashtra"),
            new City("Osmanabad","Maharashtra"), new City("Bid","Maharashtra"),
            new City("Gondia","Maharashtra"), new City("Yavatmal","Maharashtra"),
            new City("Wardha","Maharashtra"), new City("Buldhana","Maharashtra"),

            // Manipur
            new City("Imphal","Manipur"), new City("Thoubal","Manipur"),
            new City("Bishnupur","Manipur"), new City("Churachandpur","Manipur"),
            new City("Kakching","Manipur"),

            // Meghalaya
            new City("Shillong","Meghalaya"), new City("Tura","Meghalaya"),
            new City("Jowai","Meghalaya"), new City("Nongstoin","Meghalaya"),
            new City("Williamnagar","Meghalaya"),

            // Mizoram
            new City("Aizawl","Mizoram"), new City("Lunglei","Mizoram"),
            new City("Champhai","Mizoram"), new City("Serchhip","Mizoram"),
            new City("Kolasib","Mizoram"),

            // Nagaland
            new City("Kohima","Nagaland"), new City("Dimapur","Nagaland"),
            new City("Mokokchung","Nagaland"), new City("Wokha","Nagaland"),
            new City("Tuensang","Nagaland"),

            // Odisha
            new City("Bhubaneswar","Odisha"), new City("Cuttack","Odisha"),
            new City("Rourkela","Odisha"), new City("Brahmapur","Odisha"),
            new City("Sambalpur","Odisha"), new City("Puri","Odisha"),
            new City("Balasore","Odisha"), new City("Bhadrak","Odisha"),
            new City("Baripada","Odisha"), new City("Jharsuguda","Odisha"),
            new City("Angul","Odisha"), new City("Dhenkanal","Odisha"),
            new City("Kendujhar","Odisha"), new City("Balangir","Odisha"),
            new City("Phulbani","Odisha"), new City("Koraput","Odisha"),
            new City("Rayagada","Odisha"), new City("Bargarh","Odisha"),
            new City("Paradeep","Odisha"), new City("Jeypore","Odisha"),

            // Punjab
            new City("Ludhiana","Punjab"), new City("Amritsar","Punjab"),
            new City("Jalandhar","Punjab"), new City("Patiala","Punjab"),
            new City("Bathinda","Punjab"), new City("Mohali","Punjab"),
            new City("Hoshiarpur","Punjab"), new City("Batala","Punjab"),
            new City("Pathankot","Punjab"), new City("Moga","Punjab"),
            new City("Firozpur","Punjab"), new City("Abohar","Punjab"),
            new City("Barnala","Punjab"), new City("Rajpura","Punjab"),
            new City("Phagwara","Punjab"), new City("Muktsar","Punjab"),
            new City("Gurdaspur","Punjab"), new City("Kapurthala","Punjab"),
            new City("Rupnagar","Punjab"), new City("Fatehgarh Sahib","Punjab"),

            // Rajasthan
            new City("Jaipur","Rajasthan"), new City("Jodhpur","Rajasthan"),
            new City("Kota","Rajasthan"), new City("Bikaner","Rajasthan"),
            new City("Ajmer","Rajasthan"), new City("Udaipur","Rajasthan"),
            new City("Bhilwara","Rajasthan"), new City("Alwar","Rajasthan"),
            new City("Bharatpur","Rajasthan"), new City("Sikar","Rajasthan"),
            new City("Sri Ganganagar","Rajasthan"), new City("Pali","Rajasthan"),
            new City("Barmer","Rajasthan"), new City("Jhunjhunu","Rajasthan"),
            new City("Kishangarh","Rajasthan"), new City("Tonk","Rajasthan"),
            new City("Beawar","Rajasthan"), new City("Hanumangarh","Rajasthan"),
            new City("Sawai Madhopur","Rajasthan"), new City("Nagaur","Rajasthan"),
            new City("Jhalawar","Rajasthan"), new City("Baran","Rajasthan"),
            new City("Dholpur","Rajasthan"), new City("Churu","Rajasthan"),
            new City("Dausa","Rajasthan"), new City("Banswara","Rajasthan"),
            new City("Dungarpur","Rajasthan"), new City("Bundi","Rajasthan"),

            // Sikkim
            new City("Gangtok","Sikkim"), new City("Namchi","Sikkim"),
            new City("Gyalshing","Sikkim"), new City("Mangan","Sikkim"),

            // Tamil Nadu
            new City("Chennai","Tamil Nadu"), new City("Coimbatore","Tamil Nadu"),
            new City("Madurai","Tamil Nadu"), new City("Tiruchirappalli","Tamil Nadu"),
            new City("Salem","Tamil Nadu"), new City("Tirunelveli","Tamil Nadu"),
            new City("Tiruppur","Tamil Nadu"), new City("Ranipet","Tamil Nadu"),
            new City("Vellore","Tamil Nadu"), new City("Erode","Tamil Nadu"),
            new City("Thoothukudi","Tamil Nadu"), new City("Dindigul","Tamil Nadu"),
            new City("Thanjavur","Tamil Nadu"), new City("Karaikudi","Tamil Nadu"),
            new City("Nagapattinam","Tamil Nadu"), new City("Kancheepuram","Tamil Nadu"),
            new City("Kumbakonam","Tamil Nadu"), new City("Cuddalore","Tamil Nadu"),
            new City("Hosur","Tamil Nadu"), new City("Sivakasi","Tamil Nadu"),
            new City("Nagercoil","Tamil Nadu"), new City("Pollachi","Tamil Nadu"),
            new City("Pudukkottai","Tamil Nadu"), new City("Rajapalayam","Tamil Nadu"),
            new City("Ambattur","Tamil Nadu"), new City("Tiruvannaamalai","Tamil Nadu"),
            new City("Villupuram","Tamil Nadu"), new City("Krishnagiri","Tamil Nadu"),
            new City("Namakkal","Tamil Nadu"), new City("Dharmapuri","Tamil Nadu"),

            // Telangana
            new City("Hyderabad","Telangana"), new City("Warangal","Telangana"),
            new City("Nizamabad","Telangana"), new City("Karimnagar","Telangana"),
            new City("Khammam","Telangana"), new City("Ramagundam","Telangana"),
            new City("Mahbubnagar","Telangana"), new City("Nalgonda","Telangana"),
            new City("Adilabad","Telangana"), new City("Suryapet","Telangana"),
            new City("Miryalaguda","Telangana"), new City("Siddipet","Telangana"),
            new City("Mancherial","Telangana"), new City("Kothagudem","Telangana"),
            new City("Jagtial","Telangana"), new City("Wanaparthy","Telangana"),
            new City("Sangareddy","Telangana"), new City("Bhongir","Telangana"),

            // Tripura
            new City("Agartala","Tripura"), new City("Udaipur","Tripura"),
            new City("Dharmanagar","Tripura"), new City("Kailasahar","Tripura"),
            new City("Ambassa","Tripura"),

            // Uttar Pradesh
            new City("Lucknow","Uttar Pradesh"), new City("Kanpur","Uttar Pradesh"),
            new City("Ghaziabad","Uttar Pradesh"), new City("Agra","Uttar Pradesh"),
            new City("Meerut","Uttar Pradesh"), new City("Varanasi","Uttar Pradesh"),
            new City("Prayagraj","Uttar Pradesh"), new City("Bareilly","Uttar Pradesh"),
            new City("Aligarh","Uttar Pradesh"), new City("Moradabad","Uttar Pradesh"),
            new City("Saharanpur","Uttar Pradesh"), new City("Gorakhpur","Uttar Pradesh"),
            new City("Noida","Uttar Pradesh"), new City("Firozabad","Uttar Pradesh"),
            new City("Jhansi","Uttar Pradesh"), new City("Muzaffarnagar","Uttar Pradesh"),
            new City("Mathura","Uttar Pradesh"), new City("Rampur","Uttar Pradesh"),
            new City("Shahjahanpur","Uttar Pradesh"), new City("Mau","Uttar Pradesh"),
            new City("Hapur","Uttar Pradesh"), new City("Etawah","Uttar Pradesh"),
            new City("Mirzapur","Uttar Pradesh"), new City("Bulandshahr","Uttar Pradesh"),
            new City("Sambhal","Uttar Pradesh"), new City("Amroha","Uttar Pradesh"),
            new City("Hardoi","Uttar Pradesh"), new City("Azamgarh","Uttar Pradesh"),
            new City("Bahraich","Uttar Pradesh"), new City("Sultanpur","Uttar Pradesh"),
            new City("Ballia","Uttar Pradesh"), new City("Unnao","Uttar Pradesh"),
            new City("Rae Bareli","Uttar Pradesh"), new City("Bijnor","Uttar Pradesh"),
            new City("Orai","Uttar Pradesh"), new City("Ghazipur","Uttar Pradesh"),
            new City("Sitapur","Uttar Pradesh"), new City("Ayodhya","Uttar Pradesh"),
            new City("Banda","Uttar Pradesh"), new City("Budaun","Uttar Pradesh"),
            new City("Mainpuri","Uttar Pradesh"), new City("Pratapgarh","Uttar Pradesh"),
            new City("Jaunpur","Uttar Pradesh"), new City("Deoria","Uttar Pradesh"),
            new City("Lakhimpur","Uttar Pradesh"), new City("Basti","Uttar Pradesh"),
            new City("Greater Noida","Uttar Pradesh"), new City("Vrindavan","Uttar Pradesh"),

            // Uttarakhand
            new City("Dehradun","Uttarakhand"), new City("Haridwar","Uttarakhand"),
            new City("Roorkee","Uttarakhand"), new City("Haldwani","Uttarakhand"),
            new City("Rudrapur","Uttarakhand"), new City("Kashipur","Uttarakhand"),
            new City("Rishikesh","Uttarakhand"), new City("Kotdwar","Uttarakhand"),
            new City("Ramnagar","Uttarakhand"), new City("Mussoorie","Uttarakhand"),
            new City("Nainital","Uttarakhand"), new City("Almora","Uttarakhand"),
            new City("Pithoragarh","Uttarakhand"), new City("Bageshwar","Uttarakhand"),

            // West Bengal
            new City("Kolkata","West Bengal"), new City("Asansol","West Bengal"),
            new City("Siliguri","West Bengal"), new City("Durgapur","West Bengal"),
            new City("Bardhaman","West Bengal"), new City("Malda","West Bengal"),
            new City("Baharampur","West Bengal"), new City("Habra","West Bengal"),
            new City("Kharagpur","West Bengal"), new City("Shantipur","West Bengal"),
            new City("Dankuni","West Bengal"), new City("Dhulian","West Bengal"),
            new City("Ranaghat","West Bengal"), new City("Uluberia","West Bengal"),
            new City("Kalna","West Bengal"), new City("Medinipur","West Bengal"),
            new City("Haldia","West Bengal"), new City("Raiganj","West Bengal"),
            new City("Krishnanagar","West Bengal"), new City("Nabadwip","West Bengal"),
            new City("Darjeeling","West Bengal"), new City("Cooch Behar","West Bengal"),
            new City("Balurghat","West Bengal"), new City("Bankura","West Bengal"),
            new City("Purulia","West Bengal"), new City("Tamluk","West Bengal"),
            new City("Barasat","West Bengal"), new City("Barrackpore","West Bengal"),
            new City("Howrah","West Bengal"), new City("Serampore","West Bengal"),

            // Delhi (UT)
            new City("New Delhi","Delhi"), new City("Dwarka","Delhi"),
            new City("Rohini","Delhi"), new City("Narela","Delhi"),
            new City("Shahdara","Delhi"), new City("Laxmi Nagar","Delhi"),
            new City("Janakpuri","Delhi"), new City("Pitampura","Delhi"),

            // Chandigarh (UT)
            new City("Chandigarh","Chandigarh"),

            // Jammu and Kashmir (UT)
            new City("Srinagar","Jammu and Kashmir"), new City("Jammu","Jammu and Kashmir"),
            new City("Anantnag","Jammu and Kashmir"), new City("Baramulla","Jammu and Kashmir"),
            new City("Sopore","Jammu and Kashmir"), new City("Kathua","Jammu and Kashmir"),
            new City("Udhampur","Jammu and Kashmir"),

            // Ladakh (UT)
            new City("Leh","Ladakh"), new City("Kargil","Ladakh"),

            // Puducherry (UT)
            new City("Puducherry","Puducherry"), new City("Karaikal","Puducherry"),
            new City("Yanam","Puducherry"), new City("Mahe","Puducherry"),

            // Andaman and Nicobar Islands (UT)
            new City("Port Blair","Andaman and Nicobar Islands"),

            // Dadra and Nagar Haveli and Daman and Diu (UT)
            new City("Silvassa","Dadra and Nagar Haveli and Daman and Diu"),
            new City("Daman","Dadra and Nagar Haveli and Daman and Diu"),
            new City("Diu","Dadra and Nagar Haveli and Daman and Diu"),

            // Lakshadweep (UT)
            new City("Kavaratti","Lakshadweep")
        );
        cityRepo.saveAll(cities);
        System.out.println("MASTER_DATA: Seeded " + cities.size() + " cities");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COUNTRIES — 195 UN-recognised countries (India first for convenience)
    // ─────────────────────────────────────────────────────────────────────────
    private void seedCountries() {
        if (countryRepo.count() > 0) return;
        List<Country> countries = Arrays.asList(
            new Country("India"),
            new Country("Afghanistan"), new Country("Albania"), new Country("Algeria"),
            new Country("Andorra"), new Country("Angola"), new Country("Antigua and Barbuda"),
            new Country("Argentina"), new Country("Armenia"), new Country("Australia"),
            new Country("Austria"), new Country("Azerbaijan"), new Country("Bahamas"),
            new Country("Bahrain"), new Country("Bangladesh"), new Country("Barbados"),
            new Country("Belarus"), new Country("Belgium"), new Country("Belize"),
            new Country("Benin"), new Country("Bhutan"), new Country("Bolivia"),
            new Country("Bosnia and Herzegovina"), new Country("Botswana"), new Country("Brazil"),
            new Country("Brunei"), new Country("Bulgaria"), new Country("Burkina Faso"),
            new Country("Burundi"), new Country("Cabo Verde"), new Country("Cambodia"),
            new Country("Cameroon"), new Country("Canada"), new Country("Central African Republic"),
            new Country("Chad"), new Country("Chile"), new Country("China"),
            new Country("Colombia"), new Country("Comoros"), new Country("Congo"),
            new Country("Costa Rica"), new Country("Croatia"), new Country("Cuba"),
            new Country("Cyprus"), new Country("Czech Republic"), new Country("Denmark"),
            new Country("Djibouti"), new Country("Dominica"), new Country("Dominican Republic"),
            new Country("Ecuador"), new Country("Egypt"), new Country("El Salvador"),
            new Country("Equatorial Guinea"), new Country("Eritrea"), new Country("Estonia"),
            new Country("Eswatini"), new Country("Ethiopia"), new Country("Fiji"),
            new Country("Finland"), new Country("France"), new Country("Gabon"),
            new Country("Gambia"), new Country("Georgia"), new Country("Germany"),
            new Country("Ghana"), new Country("Greece"), new Country("Grenada"),
            new Country("Guatemala"), new Country("Guinea"), new Country("Guinea-Bissau"),
            new Country("Guyana"), new Country("Haiti"), new Country("Honduras"),
            new Country("Hungary"), new Country("Iceland"), new Country("Indonesia"),
            new Country("Iran"), new Country("Iraq"), new Country("Ireland"),
            new Country("Israel"), new Country("Italy"), new Country("Jamaica"),
            new Country("Japan"), new Country("Jordan"), new Country("Kazakhstan"),
            new Country("Kenya"), new Country("Kiribati"), new Country("Kuwait"),
            new Country("Kyrgyzstan"), new Country("Laos"), new Country("Latvia"),
            new Country("Lebanon"), new Country("Lesotho"), new Country("Liberia"),
            new Country("Libya"), new Country("Liechtenstein"), new Country("Lithuania"),
            new Country("Luxembourg"), new Country("Madagascar"), new Country("Malawi"),
            new Country("Malaysia"), new Country("Maldives"), new Country("Mali"),
            new Country("Malta"), new Country("Marshall Islands"), new Country("Mauritania"),
            new Country("Mauritius"), new Country("Mexico"), new Country("Micronesia"),
            new Country("Moldova"), new Country("Monaco"), new Country("Mongolia"),
            new Country("Montenegro"), new Country("Morocco"), new Country("Mozambique"),
            new Country("Myanmar"), new Country("Namibia"), new Country("Nauru"),
            new Country("Nepal"), new Country("Netherlands"), new Country("New Zealand"),
            new Country("Nicaragua"), new Country("Niger"), new Country("Nigeria"),
            new Country("North Korea"), new Country("North Macedonia"), new Country("Norway"),
            new Country("Oman"), new Country("Pakistan"), new Country("Palau"),
            new Country("Palestine"), new Country("Panama"), new Country("Papua New Guinea"),
            new Country("Paraguay"), new Country("Peru"), new Country("Philippines"),
            new Country("Poland"), new Country("Portugal"), new Country("Qatar"),
            new Country("Romania"), new Country("Russia"), new Country("Rwanda"),
            new Country("Saint Kitts and Nevis"), new Country("Saint Lucia"),
            new Country("Saint Vincent and the Grenadines"), new Country("Samoa"),
            new Country("San Marino"), new Country("Sao Tome and Principe"),
            new Country("Saudi Arabia"), new Country("Senegal"), new Country("Serbia"),
            new Country("Seychelles"), new Country("Sierra Leone"), new Country("Singapore"),
            new Country("Slovakia"), new Country("Slovenia"), new Country("Solomon Islands"),
            new Country("Somalia"), new Country("South Africa"), new Country("South Korea"),
            new Country("South Sudan"), new Country("Spain"), new Country("Sri Lanka"),
            new Country("Sudan"), new Country("Suriname"), new Country("Sweden"),
            new Country("Switzerland"), new Country("Syria"), new Country("Taiwan"),
            new Country("Tajikistan"), new Country("Tanzania"), new Country("Thailand"),
            new Country("Timor-Leste"), new Country("Togo"), new Country("Tonga"),
            new Country("Trinidad and Tobago"), new Country("Tunisia"), new Country("Turkey"),
            new Country("Turkmenistan"), new Country("Tuvalu"), new Country("Uganda"),
            new Country("Ukraine"), new Country("United Arab Emirates"),
            new Country("United Kingdom"), new Country("United States of America"),
            new Country("Uruguay"), new Country("Uzbekistan"), new Country("Vanuatu"),
            new Country("Vatican City"), new Country("Venezuela"), new Country("Vietnam"),
            new Country("Yemen"), new Country("Zambia"), new Country("Zimbabwe")
        );
        countryRepo.saveAll(countries);
        System.out.println("MASTER_DATA: Seeded " + countries.size() + " countries");
    }
}
