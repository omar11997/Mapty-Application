"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const resetBtn = document.querySelector(".reset");

/////////////set global variable
// let map, mapEvent;
////////// implement system archetect

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(Coords, Distance, Duration) {
    this.coords = Coords;
    this.distance = Distance;
    this.duration = Duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[new Date().getMonth()]
    } ${this.date.getDay()}`;
    return this.description;
  }
}

class Run extends Workout {
  type = "running";
  constructor(Coords, Distance, Duration, Cadence) {
    super(Coords, Distance, Duration);
    this.cadence = Cadence;
    this._calcPace();
    this._setDescription();
  }
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycle extends Workout {
  type = "cycling";
  constructor(Coords, Distance, Duration, ElevationGain) {
    super(Coords, Distance, Duration);
    this.elevationGain = ElevationGain;
    this._calcSpeed();
    this._setDescription();
  }
  _calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}
// const run1 = new Run([30, 29], 28, 12, 10);
// const cycle1 = new Cycle([23, 12], 12, 1, 5);
// console.log(run1, cycle1);

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //////Get User Position
    this._getPosition();

    ///// Get Data from Local Storage
    this._getLocalStroage();

    ////// Add event Listners to the DOM
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener(
      "click",
      this._moveMapToPopup.bind(this)
    );
    resetBtn.addEventListener("click", this._reset);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log("failed");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 16);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((w) => this._renderWorkoutMarker(w));
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 100);
  }

  _toggleElevationField() {
    inputElevation.closest("div").classList.toggle("form__row--hidden");
    inputCadence.closest("div").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const isAllNumbers = (...inputs) => inputs.every((inp) => isFinite(inp));
    const isAllPositive = (...inputs) => inputs.every((inp) => inp > 0);
    ///Get data from form (user)
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    ///check if the data is valid inside the type

    ///if the workout is Running create run object
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !isAllNumbers(cadence, distance, duration) ||
        !isAllPositive(cadence, distance, duration)
      )
        return alert("you insert an Unvalid data");

      workout = new Run([lat, lng], distance, duration, cadence);
    }

    /// if the workout is cycling create cycle object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !isAllNumbers(elevation, distance, duration) ||
        !isAllPositive(elevation, distance, duration)
      )
        return alert("you insert an Unvalid data");

      workout = new Cycle([lat, lng], distance, duration, elevation);
    }
    ///add the new workout to the workout array
    this.#workouts.push(workout);
    ///render the workout on the map marker
    /////////////add marker when submitting the form
    this._renderWorkoutMarker(workout);

    ///Render Workout in list
    this._renderWorkout(workout);
    /// Hide form + Clear Input fields
    this._hideForm();

    //// Set Data to local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        ///////this method creates a popup and bind it to the marker
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          // content: "workout",
        })
      )
      .setPopupContent(
        `${workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"}${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === "running") {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    if (workout.type === "cycling") {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveMapToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id == workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 16, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStroage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((w) => {
      this._renderWorkout(w);
      // this._renderWorkoutMarker(w);
    });
  }
  _reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
