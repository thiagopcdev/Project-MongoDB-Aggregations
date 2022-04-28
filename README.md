### Projeto MongoDB Aggregations!

#### Habilidades
Neste projeto você será capaz de:
- Executar buscas complexas no banco mongoDB
- Usar os operadores de aggregation para fazer uma pipeline  

---

Para esse projeto, diferentemente dos outros, utilizei várias coleções, de forma que possa praticar em vários cenários os diversos operadores e estágios do `aggregation pipeline`.

Trabalhei com dados do **IMDB**, dados sobre empresas aéreas e também dados que contenham registros de deslocamento de pessoas que utilizam bicicletas.

---

#### Requisitos do projeto

#### Desafio 1

Ajude a Trybe a escolher um filme para a próxima noite! Baseado em uma pesquisa, decidimos que os filmes em potencial devem atender alguns critérios, vejamos:

##### Retorne todos os filmes que satisfaça, através de uma  _pipeline_, as condições abaixo

* `imdb.rating` deve ser maior ou igual a `7`;
* `genres` não deve conter `Crime` ou `Horror`;
* `rated` deve ser igual a `PG` ou `G`;
* `languages` contém `English` e `Spanish`.
* Utilize a coleção `movies`.

~~~javascript
  db.movies.aggregate([
    {
      $match: {
        "imdb.rating": { $gte: 7 },
        genres: { $nin: ["Crime", "Horror"] },
        rated: { $in: ["PG", "G"] },
        $and: [{ languages: "English" }, { languages: "Spanish" }],
      },
    },
  ]);
~~~

#### Desafio 2

A escolha do filme da noite foi um sucesso, mas infelizmente ficamos com nossa banda de internet quase esgotada, e ainda precisamos de uma nova recomendação de filme. Para diminuir o volume de dados trafegados:

##### Utilizando o mesmo _pipeline_ anterior, retorne apenas os campos `title`, `rated`, `imdb.rating`, `imdb.votes` e `year`, modificando seus nomes para `titulo`, `avaliado`, `notaIMDB`, `votosIMDB` e `ano`, respectivamente.


~~~javascript
  db.movies.aggregate([
    {
      $match: {
        "imdb.rating": { $gte: 7 },
        genres: { $nin: ["Crime", "Horror"] },
        rated: { $in: ["PG", "G"] },
        $and: [{ languages: "English" }, { languages: "Spanish" }],
      },
    },
    {
      $project: {
        _id: 0,
        titulo: "$title",
        avaliado: "$rated",
        notaIMDB: "$imdb.rating",
        votosIMDB: "$imdb.votes",
        ano: "$year",
      },
    },
  ]);
~~~

#### Desafio 3

Agora que você tem os campos essenciais, aplique mais um estágio na pipeline do desafio anterior que atenda a seguinte demanda:

##### Retorne esses filmes ordenados por ano e nota IMDB de forma decrescente e título por ordem alfabética.

~~~javascript
  db.movies.aggregate([
    {
      $match: {
        "imdb.rating": { $gte: 7 },
        genres: { $nin: ["Crime", "Horror"] },
        rated: { $in: ["PG", "G"] },
        $and: [{ languages: "English" }, { languages: "Spanish" }],
      },
    },
    {
      $project: {
        _id: 0,
        titulo: "$title",
        avaliado: "$rated",
        notaIMDB: "$imdb.rating",
        votosIMDB: "$imdb.votes",
        ano: "$year",
      },
    },
    {
      $sort: { ano: -1, notaIMDB: -1, titulo: 1 },
    },
  ]);
~~~

#### Desafio 4

Nossa coleção de filmes tem muitos documentos diferentes, alguns com títulos "mais complexos" do que outros. Se quisermos analisar nossa coleção para encontrar títulos de filmes que têm uma só palavra no título, poderíamos buscar todos os filmes da coleção e processar isso na aplicação, mas o `Aggregation Framework` nos permite fazer isso diretamente no lado do banco de dados.

##### Crie uma _pipeline_ que retorna documentos  com o novo campo `title_split`, ela deve seguir as seguintes condições:

- `title_split` deve conter uma lista de palavras presentes em `title`.
- A pipeline deve retornar apenas filmes com o título composto apenas de uma palavra.
- A pipeline deve ser ordenada por `title` em ordem alfabética.
- A pipeline deve retornar apenas o campo `title_split`.

~~~javascript
  db.movies.aggregate([
    {
      $addFields: {
        title_split: { $split: ["$title", " "] },
      },
    },
    {
      $match: {
        title_split: { $size: 1 },
      },
    },
    {
      $sort: { title: 1 },
    },
    {
      $project: { _id: 0, title_split: 1 },
    },
  ]);
~~~

#### Desafio 5

Temos outra noite de filme aqui na Trybe e, desta vez, nós perguntamos à equipe quais são suas pessoas preferidas como atores e/ou atrizes. Aqui está o resultado:

* Sandra Bullock
* Tom Hanks
* Julia Roberts
* Kevin Spacey
* George Clooney

##### Considerando esta lista, crie uma _pipeline_ que retorne o `title` do vigésimo quinto filme da agregação que satisfaz as seguintes condições:

- `countries` é Estados unidos no banco estará classificado como USA
- `tomatoes.viewer.rating` maior ou igual a `3`
-  Crie um novo campo chamado `num_favs`, que represente quantos atores ou atrizes da nossa lista de favoritos aparecem no elenco (informação do campo `cast` no banco) do filme, caso ele possua favoritos.
- Ordene os resultados por `num_favs`, `tomatoes.viewer.rating` e `title`, todos em ordem decrescente.

~~~javascript
  const actors = ["Sandra Bullock", "Tom Hanks", "Julia Roberts", "Kevin Spacey", "George Clooney"];

  db.movies.aggregate([
    {
      $match: {
        cast: { $in: actors },
        countries: "USA",
        "tomatoes.viewer.rating": { $gte: 3 },
      },
    },
    {
      $addFields: {
        num_favs: { $size: { $setIntersection: [actors, "$cast"] } },
      },
    },
    {
      $sort: { num_favs: -1, "tomatoes.viewer.rating": -1, title: -1 },
    },
    {
      $project: { _id: 0, title: 1 },
    },
    { $skip: 24 },
    { $limit: 1 },
  ]);
~~~

#### Desafio 6

Vamos explorar mais operadores aritméticos!

##### Considerando todos os filmes que ganharam o Oscar pelo menos uma vez, calcule o **maior valor**, **menor valor**, **média** e o **desvio padrão** das avaliações (informação do campo `imdb.rating` no banco)

- Para a média e o desvio padrão arredonde os valores para uma casa decimal utilizando o [`$round`](https://docs.mongodb.com/manual/reference/operator/aggregation/round/index.html).

~~~javascript
  db.movies.aggregate([
    {
      $match: {
        awards: /won [0-9]* oscar?/i,
      },
    },
    {
      $group: {
        _id: null,
        maior_rating: { $max: "$imdb.rating" },
        menor_rating: { $min: "$imdb.rating" },
        media_rating: { $avg: "$imdb.rating" },
        desvio_padrao: { $stdDevSamp: "$imdb.rating" },
      },
    },
    {
      $project: {
        _id: 0,
        maior_rating: { $round: ["$maior_rating", 1] },
        menor_rating: { $round: ["$menor_rating", 1] },
        media_rating: { $round: ["$media_rating", 1] },
        desvio_padrao: { $round: ["$desvio_padrao", 1] },
      },
    },
  ]);
~~~

#### Desafio 7

Vamos nos aprofundar um pouco mais em nossa coleção de filmes. 

##### Conte quantos filmes cada um dos atores e atrizes do elenco (`cast` no banco) já participou e obtenha uma média do campo `imdb.rating` para cada um desses atores e atrizes.

- Traga o nome do ator ou atriz;
- Número de filmes em que participou
- Média do imdb desses filmes arredondada para uma casa decimal usando o operador [`$round`](https://docs.mongodb.com/manual/reference/operator/aggregation/round/index.html).
- Considere somente os membros do elenco de filmes com o idioma inglês (`English`). 
- Exiba a lista em ordem decrescente de documentos pelo número de filmes e nome do ator ou atriz.

~~~javascript
  db.movies.aggregate([
    {
      $match: {
        languages: "English",
      },
    },
    {
      $unwind: "$cast",
    },
    {
      $group: {
        _id: "$cast",
        numeroFilmes: { $sum: 1 },
        mediaIMDB: { $avg: "$imdb.rating" },
      },
    },
    {
      $sort: { numeroFilmes: -1, _id: -1 },
    },
    {
      $project: {
        _id: 1,
        numeroFilmes: { $round: ["$numeroFilmes", 1] },
        mediaIMDB: { $round: ["$mediaIMDB", 1] },
      },
    },
  ]);
~~~

#### Desafio 8

Trocando de contexto, vamos utilizar nossa outra coleção que contém dados de empresas aéreas, suas rotas, seus voos e parcerias.

##### Liste todas as parcerias da coleção `air_alliances`, que voam rotas com um Boing 747 ou um Airbus A380 , para descobrir qual delas tem o maior número de rotas com esses aviões.

No campo `airplane`, na coleção `air_routes`: 
- Boing 747 está abreviado para `747`
- Airbus A380 está abreviado para `380`

~~~javascript
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
~~~

#### Desafio 9

##### A partir da coleção `trips`, determine o menor e o maior ano de nascimento. 

- Guarde essa informação, você precisará dela mais tarde.

- Não considere documentos com valores vazios (`""`) e em que o campo não existe!

- Para este desafio utilize o operador [`$toInt`](https://docs.mongodb.com/manual/reference/operator/aggregation/toInt/index.html) para converter de string para valor inteiro.

~~~javascript
  db.trips.aggregate([
    {
      $match: {
        birthYear: {
          $exists: true,
          $ne: "",
        },
      },
    },
    {
      $group: {
        _id: null,
        maiorAnoNascimento: { $max: { $toInt: "$birthYear" } },
        menorAnoNascimento: { $min: { $toInt: "$birthYear" } },
      },
    },
    {
      $project: {
        _id: 0,
        maiorAnoNascimento: 1,
        menorAnoNascimento: 1,
      },
    },
  ]);
~~~

#### Desafio 10

##### Encontre a duração média de viagens por tipo de usuário. 

- Exiba o valor em horas com apenas duas casas decimais 
- Exiba a média de viagens ordenada de forma crescente. 

~~~javascript
  db.trips.aggregate([
    {
      $group: {
        _id: "$usertype",
        duracaoMedia: {
          $avg: {
            $divide: [{ $subtract: ["$stopTime", "$startTime"] }, 60 * 60 * 1000],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        tipo: "$_id",
        duracaoMedia: { $round: ["$duracaoMedia", 2] },
      },
    },
  ]);
~~~

#### Desafio 11

##### Determine qual o dia da semana com maior número de viagens iniciadas.

~~~javascript
  db.trips.aggregate([
    {
      $group: {
        _id: { $dayOfWeek: "$startTime" },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        diaDaSemana: "$_id",
        total: "$total",
      },
    },
  ]);
~~~

#### Desafio 12

##### Usando a pipeline anterior que retorna o dia com mais viagens, determine qual estação tem o maior número de viagens nesse dia da semana.

- Exiba apenas o nome da estação e o total de viagens.

~~~javascript
  db.trips.aggregate([
    {
      $group: {
        _id: {
          diaDaSemana: { $dayOfWeek: "$startTime" },
          nomeEstacao: "$startStationName",
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        nomeEstacao: "$_id.nomeEstacao",
        total: "$total",
      },
    },
  ]);
~~~

#### Desafio 13

##### Determine a duração média das viagens iniciadas no dia `10/03/2016`, em minutos.

- Arredonde o resultado para cima.

~~~javascript
  db.trips.aggregate([
    {
      $match: {
        startTime: {
          $gte: ISODate("2016-03-10T00:00:00"),
          $lte: ISODate("2016-03-10T23:59:59"),
        },
      },
    },
    {
      $group: {
        _id: null,
        duracao: {
          $avg: {
            $divide: [{ $subtract: ["$stopTime", "$startTime"] }, 60 * 1000],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        duracaoMediaEmMinutos: { $ceil: "$duracao" },
      },
    },
  ]);
~~~

#### Desafio 14

##### Baseado na duração média das viagens, determine quais são as `5` bicicletas que foram mais utilizadas. 

- Exiba o resultado em minutos arredondados para cima e em ordem decrescente.

~~~javascript
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
~~~
