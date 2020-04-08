require("dotenv").config();
const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");
const cp = require("child_process");

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function sleep(milliseconds) {
  console.log("> Sleeping...");
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getAllPlaces() {
  const places = [];
  const { COORDS, RADIUS } = process.env;
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${COORDS}&type=restaurant&radius=${RADIUS}&key=${API_KEY}`;
  let nextPage = true;

  while (nextPage) {
    try {
      console.log("> Fetching all places...");
      const { data } = await axios.get(url);

      for (const place of data.results) {
        places.push({
          name: place.name,
          placeId: place.place_id,
        });
      }

      if (data.next_page_token) {
        await sleep(2700);
        // Can change type below
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${COORDS}&type=restaurant&radius=${RADIUS}&key=${API_KEY}&pagetoken=${data.next_page_token}`;
      } else {
        nextPage = false;
      }
    } catch (err) {
      throw err;
    }
  }

  return places;
}

async function getPlaceDetail(placeId) {
  try {
    console.log("> Fetching place...");
    const { data } = await axios.get(
      // Can change fields below
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_address,formatted_phone_number&key=${API_KEY}`
    );
    return data.result;
  } catch (err) {
    throw err;
  }
}

async function main() {
  try {
    const places = await getAllPlaces();

    const formattedPlaces = [];

    for (const place of places) {
      const {
        name,
        website,
        formatted_address,
        formatted_phone_number,
      } = await getPlaceDetail(place.placeId);

      formattedPlaces.push({
        name,
        website,
        address: formatted_address,
        phone: formatted_phone_number,
      });
    }

    const csv = new ObjectsToCsv(formattedPlaces);
    await csv.toDisk("./places.csv");
    cp.exec("open places.csv", (error, stdout, stderr) => {
      if (stderr) console.error(stderr);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
