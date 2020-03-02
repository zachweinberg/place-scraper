require("dotenv").config();
const axios = require("axios");
const ObjectsToCsv = require("objects-to-csv");

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function sleep(milliseconds) {
  console.log("> Sleeping...");
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function getAllRestaurants() {
  const restaurants = [];
  const COORDS = process.env.COORDS;
  const RADIUS = process.env.RADIUS;
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${COORDS}&type=restaurant&radius=${RADIUS}&key=${API_KEY}`;
  let nextPage = true;

  while (nextPage) {
    try {
      console.log("> Fetching all places...");
      const { data } = await axios.get(url);

      for (const restaurant of data.results) {
        restaurants.push({
          name: restaurant.name,
          placeId: restaurant.place_id
        });
      }

      if (data.next_page_token) {
        await sleep(2700);
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${COORDS}&type=restaurant&radius=${RADIUS}&key=${API_KEY}&pagetoken=${data.next_page_token}`;
      } else {
        nextPage = false;
      }
    } catch (err) {
      throw err;
    }
  }

  return restaurants;
}

async function getRestaurantDetail(placeId) {
  try {
    console.log("> Fetching place...");
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_address,formatted_phone_number&key=${API_KEY}`
    );
    return data.result;
  } catch (err) {
    throw err;
  }
}

async function main() {
  try {
    const restaurants = await getAllRestaurants();

    const formattedRestaurants = [];

    for (const restaurant of restaurants) {
      const {
        name,
        website,
        formatted_address,
        formatted_phone_number
      } = await getRestaurantDetail(restaurant.placeId);

      formattedRestaurants.push({
        name,
        website,
        address: formatted_address,
        phone: formatted_phone_number
      });
    }

    const csv = new ObjectsToCsv(formattedRestaurants);
    await csv.toDisk("./places.csv");
  } catch (err) {
    console.error(err);
  }
}

main();
