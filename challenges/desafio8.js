db.air_routes.aggregate([
  {
    $match: {
      airplane: { $in: ["747", "380"] },
    },
  },
  {
    $lookup: {
      from: "air_alliances",
      let: { air_name: "$airline.name" },
      pipeline: [
        { $unwind: "$airlines" },
        {
          $match: { $expr: {
            $eq: ["$airlines", "$$air_name"],
          } },
        },
      ],
      as: "air_alliance",
    },
  },
  { $unwind: "$air_alliance" },
  {
    $group: {
      _id: "$air_alliance.name",
      totalRotas: { $sum: 1 },
    },
  },
  {
    $sort: { totalRotas: -1 },
  },
  { $limit: 1 },
]);
