var ele;
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYzA0MDEyMG1iIiwiYSI6ImNreWtpYWZ4ZTJ3ZjkydnA4YTFkcXVxb3oifQ.Jk2yP5Db0fcp5cHKNuS7OQ";
    var map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-3.462917352171686, 56.382557538652492],
      zoom: 12,
    });

    map.on("load", function () {
      map.loadImage(
        "https://assets.giser.tech/bus_red.png",
        function (error, image) {
          if (error) throw error;
          map.addImage("bus-red-icon", image);
          map.loadImage(
            "https://assets.giser.tech/bus_green.png",
            function (error, image) {
              if (error) throw error;
              map.addImage("bus-green-icon", image);
              map.loadImage(
                "https://assets.giser.tech/bus_blue.png",
                function (error, image) {
                  if (error) throw error;
                  map.addImage("bus-blue-icon", image);
                  map.addSource("bus-stations", {
                    type: "geojson",
                    data: "https://assets.giser.tech/bus%20station_WGS84_3.geojson",
                  });
                
                  map.addLayer({
                    id: "bus-stations-layer",
                    type: "symbol",
                    source: "bus-stations",
                    layout: {
                      "icon-image": [
                        "match",
                        ["get", "BusStopTyp"],
                        "MKD",
                        "bus-red-icon",
                        "CUS",
                        "bus-green-icon",
                        "bus-blue-icon",
                      ],
                      "icon-size": 0.25, 
                    },
                    paint: {
                      "icon-color": "red",
                    },
                  });
                }
              );
            }
          );
        }
      );

      document
        .getElementById("searchBtn")
        .addEventListener("click", function () {
          var searchTerm = document.getElementById("search").value; 
          if (searchTerm) {
            saveSearchTerm(searchTerm); 
            var features = map.querySourceFeatures("bus-stations");

            var matchedFeatures = features.filter(
              (feature) =>
                feature.properties.CommonName.toLowerCase() ==
                searchTerm.toLowerCase()
            );
            console.log(matchedFeatures);

            if (matchedFeatures.length > 0) {
              
              var show_MKD = document.getElementById("MKD").checked;
              var show_CUS = document.getElementById("CUS").checked;
              var show_HAR = document.getElementById("HAR").checked;
              let BusStopTyp = matchedFeatures[0].properties.BusStopTyp;
              if (
                (BusStopTyp === "MKD" && !show_MKD) ||
                (BusStopTyp === "CUS" && !show_CUS) ||
                (BusStopTyp === "HAR" && !show_HAR)
              ) {
                layer.msg("No matching locations found.");
                return;
              }

             
              var popups = document.getElementsByClassName("mapboxgl-popup");
              for (var i = 0; i < popups.length; i++) {
                popups[i].remove();
              }

              var bounds = new mapboxgl.LngLatBounds();
              matchedFeatures.forEach(function (feature) {
                bounds.extend(feature.geometry.coordinates);
              });

             
              map.fitBounds(bounds, {
                padding: 200,
              });
            
              map.once("moveend", function () {
                matchedFeatures.forEach((feature) => {
                  var popup = new mapboxgl.Popup()
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(
                      `<div>CommonName: ${feature.properties.CommonName}<br>` +
                        `Street: ${feature.properties.Street}<br>` +
                        `Bearing: ${feature.properties.Bearing}<br>` +
                        `LocalityNa: ${feature.properties.LocalityNa}<br>` +
                        `BusStopTyp: ${feature.properties.BusStopTyp}</div>`
                    )
                    .addTo(map);
                });
              });
            } else {
              layer.msg("No matching locations found.");
            }
          } else {
            layer.msg("Please enter the search content.");
          }
        });
      function addToFavorites(feature) {
        let favorites = localStorage.getItem("favorites")
          ? JSON.parse(localStorage.getItem("favorites"))
          : [];
        const favorite = {
          CommonName: feature.properties.CommonName,
          coordinates: feature.geometry.coordinates,
        };
        
        for (let i = 0; i < favorites.length; i++) {
          if (
            favorites[i].CommonName === favorite.CommonName &&
            favorites[i].coordinates.join(",") ===
              favorite.coordinates.join(",")
          ) {
            return;
          }
        }
        favorites.push(favorite);
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }

      map.on("click", "bus-stations-layer", function (e) {
        ele = e.features[0];
        console.log(ele);
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description =
          `<div>CommonName: ${e.features[0].properties.CommonName}<br>` +
          `Street: ${e.features[0].properties.Street}<br>` +
          `Bearing: ${e.features[0].properties.Bearing}<br>` +
          `LocalityNa: ${e.features[0].properties.LocalityNa}<br>` +
          `BusStopTyp: ${e.features[0].properties.BusStopTyp}</div>` +
         
          `<div style="padding:10px;text-align:center"><button class="layui-btn layui-btn-xs" style="display:inline-block" id="addFav">Add to favorite</button></div>`;

        var popup = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
        
        document.addEventListener("click", function (evt) {
          
          if (evt.target && evt.target.id === "addFav") {
            console.log(ele);
            addToFavorites(ele);
            layer.msg("Added to favorites!");
          
            document.removeEventListener("click", arguments.callee);
          }
        });
      });
    });
    
    function saveSearchTerm(term) {
      let searches = localStorage.getItem("searchTerms")
        ? JSON.parse(localStorage.getItem("searchTerms"))
        : [];
      if (searches.indexOf(term) === -1) {
        
        searches.push(term);
        localStorage.setItem("searchTerms", JSON.stringify(searches));
      }
    }

    
    function showSearchHistory() {
      layui.use(["layer"], function () {
        var layer = layui.layer;

        let searches = localStorage.getItem("searchTerms")
          ? JSON.parse(localStorage.getItem("searchTerms"))
          : [];
        if (searches.length === 0) {
          layer.msg("Your search history is empty.");
          return;
        }

        let content = `<table class="layui-table" style="width:100%">
                  <thead>
                    <tr>
                      <th>Search Term</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>`;

        searches.forEach((term, index) => {
          content += `<tr>
                  <td>${term}</td>
                  <td><button class="layui-btn layui-btn-danger layui-btn-xs" onclick="removeSearchTerm(${index})">Remove</button></td>
                </tr>`;
        });

        content += `</tbody>
              </table>`;

        layer.open({
          type: 1,
          title: "Search History",
          content: content,
          area: ["300px", "400px"],
        });
      });
    }

    
    function removeSearchTerm(index) {
      let searches = localStorage.getItem("searchTerms")
        ? JSON.parse(localStorage.getItem("searchTerms"))
        : [];
      searches.splice(index, 1); 
      localStorage.setItem("searchTerms", JSON.stringify(searches)); 
      layer.closeAll(); 
      showSearchHistory(); 
    }


    document
      .querySelectorAll(".layui-nav-item")[1]
      .addEventListener("click", showSearchHistory);

    function showFavorites() {
      let favorites = localStorage.getItem("favorites")
        ? JSON.parse(localStorage.getItem("favorites"))
        : [];
      if (favorites.length === 0) {
        layer.msg("Your favorites list is empty.");
        return;
      }

      let content = `<table class="layui-table" style="width:100%">
              <thead>
                <tr>
                  <th>Common Name</th>
                  <th>Coordinates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>`;

      favorites.forEach((fav, index) => {
        content += `<tr>
            <td>${fav.CommonName}</td>
            <td>${fav.coordinates.join(", ")}</td>
            <td><button class="layui-btn layui-btn-danger layui-btn-xs" onclick="removeFavorite(${index})">Remove</button></td>
          </tr>`;
      });

      content += `</tbody>
        </table>`;

      layer.open({
        type: 1,
        title: "My Favorites",
        content: content,
        area: ["400px", "400px"],
      });
    }

    
    function removeFavorite(index) {
      console.log(index);
      let favorites = localStorage.getItem("favorites")
        ? JSON.parse(localStorage.getItem("favorites"))
        : [];
      favorites.splice(index, 1);
      localStorage.setItem("favorites", JSON.stringify(favorites)); 
      layer.closeAll(); 
      showFavorites(); 
    }

    
    document
      .querySelectorAll(".layui-nav-item")[0]
      .addEventListener("click", function () {
        layer.closeAll(); 
        showFavorites(); 
      });

 
    layui.use(function () {
      var form = layui.form;
      var layer = layui.layer;
  
      form.on("checkbox", function (data) {
        let show_MKD = document.getElementById("MKD").checked;
        let show_CUS = document.getElementById("CUS").checked;
        let show_HAR = document.getElementById("HAR").checked;
        console.log(show_MKD, show_CUS, show_HAR);
        let filter = ["any"];
        if (show_MKD) {
          filter.push(["==", ["get", "BusStopTyp"], "MKD"]);
        }
        if (show_CUS) {
          filter.push(["==", ["get", "BusStopTyp"], "CUS"]);
        }
        if (show_HAR) {
          filter.push(["==", ["get", "BusStopTyp"], "HAR"]);
        }
        map.setFilter("bus-stations-layer", filter);
        // map.setFilter('bus-stations-layer', ['==', ['get', 'BusStopTyp'], 'MKD']);
      });
    });
map.addControl(new mapboxgl.NavigationControl(), "bottom-left");
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }),
  "bottom-left"
);