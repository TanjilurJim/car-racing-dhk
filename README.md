# 🏎️ DHAKA CITY 3D (ঢাকা সিটি রেসার ৩ডি) - LAN MULTIPLAYER & REAL PHYSICS

A full **true 3D** open-city racing, demolition PvP, and free-roam driving experience set across the multi-block streets, elevated flyovers, roundabouts, and alleys of **Dhaka, Bangladesh**!

---

## 🌟 What's New in This Version

### 1. Escape Button to Pause & Resume (`[ESC]` / `⏸️`)
- **Pause Anywhere**: Press **`[ESC]`** on your keyboard or tap the **`⏸️ PAUSE`** button on the top HUD.
- **Interactive Pause Menu Modal**:
  - Displays real-time live telemetry: Current Road, Speed, Integrity %, and Score.
  - **Resume Race (`▶ RESUME`)** — or simply tap ESC again to jump right back into the action!
  - **Restart Race (`🔄 RESTART`)** to reset your run immediately.
  - **Full Service (`🛠️ SERVICE`)** to restore your car instantly to 100% Brand New condition.
  - **One-Click LAN Invite Card**: Copy your Wi-Fi LAN multiplayer URL with a single click.

---

### 2. Real Physics, Suspension Dynamics & Realistic Visual Damage
- **Weight Transfer & Suspension Simulation**:
  - **Braking Dive**: Slamming the brakes causes the vehicle's nose to dip down forward.
  - **Acceleration Squat**: Full-throttle acceleration tilts the vehicle body back.
  - **Cornering Body Roll**: High-speed turns and drifts tilt the car outward realistically.
- **Angular Spin Momentum**:
  - Off-center impacts and t-bones apply rotational torque, inducing realistic vehicle spin-outs that require counter-steering to recover!
- **Tire Screeches & Drifting Skid Marks**:
  - Handbrake drifting (`SPACE`) or hard braking at speed triggers realistic procedural **tire screeches** and lays down skid marks on the asphalt.
- **Visible Battle Damage & Vehicle Deformation**:
  - **Front Bumper Sag**: Hard impacts bend and tilt the bumper downwards.
  - **Hood Buckling**: Severe collisions cause the engine hood to buckle open upward!
  - **Headlight Shattering**: Heavy damage breaks the glass on headlights, turning them dark.
  - **Multi-Stage Engine Damage FX**:
    - *Health < 65%*: Faint white radiator steam.
    - *Health < 40%*: Heavy black smoke billowing from under the hood.
    - *Health < 20%*: Fiery orange flame bursts and sparks shooting from the engine!
  - **Directional Impact Debris**: Crashes scatter shards of glass, metal fragments, and bright sparks in 3D.
  - **Repair Kits (🛠️)**: Collecting a repair kit straightens bent bumpers, closes buckled hoods, fixes headlights, extinguishes engine smoke, and returns the car to 100% factory new!

---

### 3. LAN Multiplayer Racing & Real-Time PvP Demolition 👥
- **Race on the Same Wi-Fi / Local Network**:
  - Zero third-party npm packages required! Powered by a lightweight built-in Node.js server (`server.js`).
  - Automatically detects your computer's LAN IP address (e.g. `http://192.168.10.102:3000`).
  - Anyone on your Wi-Fi (phone, tablet, laptop, or desktop) can open the link in their browser to immediately join your 3D session!
- **3D Remote Racers with Name Tags**:
  - See friends' 3D cars in real time with floating overhead name tags and health bars!
  - Butter-smooth network position and rotation interpolation.
- **PvP Ramming & Mutual Vehicle Damage**:
  - Ram into friends' cars with full mass & momentum physics!
  - VIP Prado SUVs (2,600 kg) smash through lighter sedans and CNGs with massive rebound force!
  - Both players take directional damage, lose vehicle integrity, and see collision particles in real time!
  - In-game Dhaka quips: *"💥 আপনি [Racer]-কে প্রচণ্ড ধাক্কা দিলেন! (-28% HP)"*

---

### 4. Hatirjheel Lake (হাতিরঝিল লেক - Inaccessible Scenic Zone)
- **Shimmering Water & Promenade**: Prominent lake in the Southeast block with real-time shimmering wave animation, water fountains, and floating water lilies.
- **Iconic Hatirjheel Arched Bridge**: Tubular white cable-stayed arch bridge spanning across the water.
- **Protective Stone Promenade Railings**: Inaccessible stone boundary barriers prevent driving into the water; colliding with the railing triggers realistic water spray particles and splash sound effects before bouncing your vehicle safely back onto the road!

---

### 5. Dense Traffic Fleet & Bangladeshi Vehicles
- 🛵 **Delivery Motorbikes (Pathao & Foodpanda)**: Agile motorbikes with helmeted riders and branded delivery boxes weaving through traffic.
- 🚐 **Dhaka Laguna / Human Hauler (হিউম্যান হলার / লেগুনা)**: Iconic local shared microbuses with blue cabins and rear passenger canopies.
- 🛺 **Cycle Rickshaws (রিকশা)**: Authentic cycle rickshaws with passenger hood art and pedaling pullers with red gamchas.
- 🟢 **Auto Rickshaws (Green CNG Baby Taxis)**: 3-wheeled autorickshaws with yellow safety cages and sputtered engine audio.
- 🚌 **Dhaka Local Buses**: Colorful, heavy transit buses (*শিকড় পরিবহন, বলাকা এক্সপ্রেস, বিকল্প অটো*) with hydraulic air horns.
- 🚗 **Toyota Premio 1.5, Yellow Dhaka Cabs & VIP Black Prado SUVs**.

---

### 6. 3D Walking Pedestrians / Humans (পথচারী)
- **Animated Walk Cycles**: Dhakaiya pedestrians dressed in Panjabi, Sarees, Lungi, and modern streetwear walking along sidewalks and zebra crossings.
- **Honk Panic Dodge**: Pressing **`H`** or tapping the on-screen **`📢 HONK`** button makes nearby pedestrians panic and scramble to the outer curbs!
- **Dhakaiya Dialogues on Near-Misses**:
  - *"এই ভাই দেখে চালান না! রাস্তা কি বাপের?!"*
  - *"আরে মামা ফুটপাতে গাড়ি উঠান ক্যান?!"*
  - *"সাবধান! পথচারী প্রায় চাপা পড়ছিলো!"*

---

## 🎮 Controls

| Action | Keyboard | Mobile / Touch Screen |
|---|---|---|
| **Accelerate Forward** | `▲` or `W` | `⚡ GAS` |
| **Brake / Reverse** | `▼` or `S` | `🛑 REV` |
| **Steer Left / Right** | `◀` `▶` or `A` `D` | `◀` `▶` |
| **Handbrake 3D Drift** | `SPACE` | `💨 DRIFT` |
| **Dhaka Horn (Clear Traffic!)** | `H` | `📢 HONK` |
| **CNG Nitro Turbo** | `SHIFT` or `N` | `🔥 NITRO` |
| **Toggle Camera (Chase / Hood)**| `C` | `🎥 CAM` |
| **Pause / Resume Game** | `ESC` | `⏸️ PAUSE` |

---

## 🚀 How to Play Locally & Invite Friends on LAN

### For Single Player or LAN Host:
1. **Double-click `play.bat`**.
   - It will automatically launch the local Node server and open `http://localhost:3000` in your browser.
   - The server window will display your LAN IP address (e.g. `http://192.168.10.102:3000`).

### To Invite Friends on the Same Wi-Fi:
1. Copy the LAN link from the in-game Pause menu or Start screen (or send them `http://<YOUR_IP>:3000`).
2. Have your friends open that URL on their **mobile phones, tablets, or computers**.
3. You'll immediately see each other's 3D cars appear in Dhaka, race together, and smash into each other with real-time PvP damage!

Enjoy cruising and smashing through 3D Dhaka! জয় বাংলা!
