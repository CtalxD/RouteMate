const axios = require("axios");

const getRoute = async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.body;

    // Make sure we have valid coordinates
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({
        success: false,
        message: "Missing required coordinates"
      });
    }

    // Using OpenRouteService API for routing
    const response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        params: {
          api_key: process.env.OPENROUTE_API_KEY || "5b3ce3597851110001cf6248de3fe14c53db415487cf9ee01ad0464e",
          start: `${fromLng},${fromLat}`,
          end: `${toLng},${toLat}`,
        },
        headers: {
          Accept: "application/json, application/geo+json",
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error getting route:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get route",
      error: error.response?.data || error.message
    });
  }
};

module.exports = {
  getRoute,
};