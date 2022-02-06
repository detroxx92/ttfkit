**ttfkit**
=================================
ttfkit is a simple webserver to create custom ttf fonts using svg icons.

**ttfkit installation instruction**
=================================

Install as docker container:

git clone https://github.com/detroxx92/ttfkit.git

Change directory to: ttfkit

* **Build docker image** 

  docker build -t ttfkit .

* **Run docker container**

  docker run -dp 3000:3000 ttfkit


**API Usage**
=================================
  Only API available of this service.

* **http://localhost:3000/ (using docker)**

* **Method:**

  `POST`
  
*  **URL Params**

   none

* **Data Params**

  `POST` body structure in JSON-format:

   **Required:**
 
   `fontName: string`

   `files: Array<Glyph>`

   **Glyph-structure:**

   `name: string`

   `data: string (base64 encoded svg file)`

* **Success Response:**
  
  Result body structure in JSON-format:

  * **Code:** 200 <br />
    **Content:** `{ 'name' : 'testFont', 'data': 'P48q....' }`