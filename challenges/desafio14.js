const aggregation = [
  {
    $group: {
      _id: "$bikeid",
      duracao: {
        $avg: {
          $divide: [{ $subtract: ["$stopTime", "$startTime"] }, 60 * 1000],
        },
      },
    },
  },
  {
    $sort: { duracao: -1 },
  },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      bikeId: "$_id",
      duracaoMedia: { $ceil: "$duracao" },
    },
  },
];

db.trips.aggregate(aggregation);
