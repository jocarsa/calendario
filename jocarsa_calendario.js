
/**
 * jocarsa_calendario.js
 * A minimalistic namespace for a calendar widget
 */

(function(global){
  // Create the namespace if not exist
  const jocarsa_calendario = {};

  // --------------------------------------------------
  // Configuration / Constants
  // --------------------------------------------------
  const diasdelasemana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  // Store all events in a global object within this namespace
  // Key format: yyyy-mm-dd-hh
  jocarsa_calendario.eventos = {};

  // Our "Event" class
  jocarsa_calendario.Evento = class {
    constructor(anio, mes, dia, hora, texto) {
      this.anio = anio;
      this.mes = mes;
      this.dia = dia;
      this.hora = hora;
      this.texto = texto;
    }
  };

  // --------------------------------------------------
  // Main Calendar Logic
  // --------------------------------------------------

  // The init function to create the calendar in a container
  jocarsa_calendario.init = function(containerId){
    const container = document.getElementById(containerId);
    if(!container) {
      console.error("jocarsa_calendario: Container not found:", containerId);
      return;
    }
    // Add the library class
    container.classList.add("jocarsa_calendario");

    // We store some global date-state here
    let currentDate = new Date(); 
    let currentView = "day"; // day | week | month | year

    // Create a nav container
    const nav = document.createElement("nav");

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "<";
    nav.appendChild(btnPrev);

    const btnNext = document.createElement("button");
    btnNext.textContent = ">";
    nav.appendChild(btnNext);

    const btnDay = document.createElement("button");
    btnDay.textContent = "Día";
    nav.appendChild(btnDay);

    const btnWeek = document.createElement("button");
    btnWeek.textContent = "Semana";
    nav.appendChild(btnWeek);

    const btnMonth = document.createElement("button");
    btnMonth.textContent = "Mes";
    nav.appendChild(btnMonth);

    const btnYear = document.createElement("button");
    btnYear.textContent = "Año";
    nav.appendChild(btnYear);

    container.appendChild(nav);

    // A container for the actual calendar content
    const calendarContainer = document.createElement("div");
    calendarContainer.classList.add("calendar-container");
    container.appendChild(calendarContainer);

    // Helpers
    function goPrev() {
      // Adjust currentDate depending on view
      switch(currentView){
        case "day":
          currentDate.setDate(currentDate.getDate()-1);
          break;
        case "week":
          currentDate.setDate(currentDate.getDate()-7);
          break;
        case "month":
          currentDate.setMonth(currentDate.getMonth()-1);
          break;
        case "year":
          currentDate.setFullYear(currentDate.getFullYear()-1);
          break;
      }
      updateCalendar();
    }
    function goNext() {
      // Adjust currentDate depending on view
      switch(currentView){
        case "day":
          currentDate.setDate(currentDate.getDate()+1);
          break;
        case "week":
          currentDate.setDate(currentDate.getDate()+7);
          break;
        case "month":
          currentDate.setMonth(currentDate.getMonth()+1);
          break;
        case "year":
          currentDate.setFullYear(currentDate.getFullYear()+1);
          break;
      }
      updateCalendar();
    }
    function showDayView() {
      currentView = "day";
      updateCalendar();
    }
    function showWeekView() {
      currentView = "week";
      updateCalendar();
    }
    function showMonthView() {
      currentView = "month";
      updateCalendar();
    }
    function showYearView() {
      currentView = "year";
      updateCalendar();
    }

    // Attach events
    btnPrev.onclick = goPrev;
    btnNext.onclick = goNext;
    btnDay.onclick = showDayView;
    btnWeek.onclick = showWeekView;
    btnMonth.onclick = showMonthView;
    btnYear.onclick = showYearView;

    // The function that re-renders the calendar depending on the current view
    function updateCalendar(){
      // Clear
      calendarContainer.innerHTML = "";

      const viewClass = {
        day: "diario",
        week: "semanal",
        month: "mensual",
        year: "anual"
      }[currentView];

      calendarContainer.className = "calendar-container " + viewClass;

      // Now call the specific rendering
      if(currentView === "day"){
        renderDayView();
      } else if(currentView === "week"){
        renderWeekView();
      } else if(currentView === "month"){
        renderMonthView();
      } else if(currentView === "year"){
        renderYearView();
      }
    }

    // Day view: show 24 rows for hours
    function renderDayView(){
      const day = currentDate.getDate();
      const month = currentDate.getMonth()+1;
      const year = currentDate.getFullYear();
      let weekday = currentDate.getDay(); // 0=Sunday...6=Saturday
      if(weekday===0) weekday=7; // Make Sunday the 7th day to match your array logic
      const title = document.createElement("h4");
      title.textContent = `${diasdelasemana[weekday-1]}, ${day} de ${meses[month-1]} de ${year}`;
      calendarContainer.appendChild(title);

      for(let hora=0; hora<=23; hora++){
        const row = document.createElement("div");
        const spanHora = document.createElement("span");
        spanHora.textContent = hora + ":00h";
        row.appendChild(spanHora);

        const input = document.createElement("input");
        input.setAttribute("anio", year);
        input.setAttribute("mes", month);
        input.setAttribute("dia", day);
        input.setAttribute("hora", hora);

        // If we already have an event saved, show it
        const key = `${year}-${month}-${day}-${hora}`;
        if(jocarsa_calendario.eventos[key]){
          input.value = jocarsa_calendario.eventos[key].texto;
        }

        input.onchange = function(){
          const eKey = `${this.getAttribute("anio")}-${this.getAttribute("mes")}-${this.getAttribute("dia")}-${this.getAttribute("hora")}`;
          jocarsa_calendario.eventos[eKey] = new jocarsa_calendario.Evento(
            this.getAttribute("anio"),
            this.getAttribute("mes"),
            this.getAttribute("dia"),
            this.getAttribute("hora"),
            this.value
          );
          // Example: Save to server via fetch
          fetch('guarda.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jocarsa_calendario.eventos)
          })
          .then(response => response.json())
          .then(result => {
            console.log('Success:', result);
          })
          .catch(error => {
            console.error('Error:', error);
          });
        };
        row.appendChild(input);
        calendarContainer.appendChild(row);
      }
    }

    // Week view: show columns for each day from Monday to Sunday
    function renderWeekView(){
      // We find the "monday" (or any start-of-week) for currentDate
      // If currentDate is Sunday, weekday=7 in the system used above
      const temp = new Date(currentDate.getTime());
      let dayOfWeek = temp.getDay();
      if(dayOfWeek === 0) dayOfWeek = 7; 
      // Set temp to Monday of that week
      temp.setDate(temp.getDate() - (dayOfWeek - 1));

      // Header: show the week's Monday date
      const year = temp.getFullYear();
      const month = temp.getMonth() + 1;
      const dateNum = temp.getDate();
      const h4 = document.createElement("h4");
      h4.textContent = `Semana del ${dateNum} de ${meses[month-1]} de ${year}`;
      calendarContainer.appendChild(h4);

      // Container for the 7 days
      const weekWrapper = document.createElement("div");
      weekWrapper.classList.add("semanal");

      // Now build each day
      for(let i=0; i<7; i++){
        const thisDay = new Date(temp.getTime());
        thisDay.setDate(temp.getDate()+i);

        const dayNameIndex = thisDay.getDay() === 0 ? 6 : thisDay.getDay()-1; 
        const dayOfMonth = thisDay.getDate();
        const dayMonth = thisDay.getMonth()+1;
        const dayYear = thisDay.getFullYear();

        const dayColumn = document.createElement("div");
        dayColumn.classList.add("dia");

        const dayHeader = document.createElement("h4");
        dayHeader.textContent = `${diasdelasemana[dayNameIndex]} ${dayOfMonth}/${dayMonth}`;
        dayColumn.appendChild(dayHeader);

        // Now create 24 rows for hours
        for(let hora=0; hora<24; hora++){
          const row = document.createElement("div");
          const spanHora = document.createElement("span");
          spanHora.textContent = hora + ":00h";
          row.appendChild(spanHora);

          const input = document.createElement("input");
          input.setAttribute("anio", dayYear);
          input.setAttribute("mes", dayMonth);
          input.setAttribute("dia", dayOfMonth);
          input.setAttribute("hora", hora);

          // If we have an event, load it
          const key = `${dayYear}-${dayMonth}-${dayOfMonth}-${hora}`;
          if(jocarsa_calendario.eventos[key]) {
            input.value = jocarsa_calendario.eventos[key].texto;
          }

          // On change
          input.onchange = function(){
            const eKey = `${this.getAttribute("anio")}-${this.getAttribute("mes")}-${this.getAttribute("dia")}-${this.getAttribute("hora")}`;
            jocarsa_calendario.eventos[eKey] = new jocarsa_calendario.Evento(
              this.getAttribute("anio"),
              this.getAttribute("mes"),
              this.getAttribute("dia"),
              this.getAttribute("hora"),
              this.value
            );
            // Save to server
            fetch('guarda.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(jocarsa_calendario.eventos)
            })
            .then(response => response.json())
            .then(result => {
              console.log('Success:', result);
            })
            .catch(error => {
              console.error('Error:', error);
            });
          };
          row.appendChild(input);
          dayColumn.appendChild(row);
        }
        weekWrapper.appendChild(dayColumn);
      }
      calendarContainer.appendChild(weekWrapper);
    }

    // Month view: show a grid of days in the month
    function renderMonthView(){
      const year = currentDate.getFullYear();
      const monthIndex = currentDate.getMonth(); // 0..11
      const monthName = meses[monthIndex];
      const day1 = new Date(year, monthIndex, 1);
      const firstDayOfWeek = day1.getDay() === 0 ? 7 : day1.getDay(); // Make Sunday=7
      const daysInMonth = new Date(year, monthIndex+1, 0).getDate();

      const h4 = document.createElement("h4");
      h4.textContent = `${monthName} de ${year}`;
      calendarContainer.appendChild(h4);

      // We'll create a grid with one cell per day
      const monthlyWrapper = document.createElement("div");
      monthlyWrapper.classList.add("mensual");

      // Fill leading empty cells if the month doesn't start Monday
      for(let i=1; i<firstDayOfWeek; i++){
        const blankCell = document.createElement("div");
        blankCell.classList.add("dia-mes");
        monthlyWrapper.appendChild(blankCell);
      }

      for(let dayNum=1; dayNum<=daysInMonth; dayNum++){
        const cell = document.createElement("div");
        cell.classList.add("dia-mes");

        const dayHeader = document.createElement("div");
        dayHeader.classList.add("dia-header");
        dayHeader.textContent = dayNum;
        cell.appendChild(dayHeader);

        // If we want to show all hour-based events in a small snippet:
        for(let hora=0; hora<24; hora++){
          const key = `${year}-${monthIndex+1}-${dayNum}-${hora}`;
          if(jocarsa_calendario.eventos[key] && jocarsa_calendario.eventos[key].texto){
            const miniEvent = document.createElement("div");
            miniEvent.textContent = hora + ": " + jocarsa_calendario.eventos[key].texto;
            cell.appendChild(miniEvent);
          }
        }

        monthlyWrapper.appendChild(cell);
      }

      calendarContainer.appendChild(monthlyWrapper);
    }

    // Year view: show 12 months in a 3x4 grid
    function renderYearView(){
      const year = currentDate.getFullYear();
      const h4 = document.createElement("h4");
      h4.textContent = `Año ${year}`;
      calendarContainer.appendChild(h4);

      const yearWrapper = document.createElement("div");
      yearWrapper.classList.add("anual");

      for(let m=0; m<12; m++){
        const monthDiv = document.createElement("div");
        monthDiv.classList.add("mes-anual");

        const mh4 = document.createElement("h4");
        mh4.textContent = meses[m];
        monthDiv.appendChild(mh4);

        // Optionally, display just the number of events or a small text
        // Or do a miniature “month style” grid. We'll keep it simple here:
        const daysInThisMonth = new Date(year, m+1, 0).getDate();

        // Could do something more sophisticated, but let's keep it short:
        for(let d=1; d<=daysInThisMonth; d++){
          for(let hora=0; hora<24; hora++){
            const key = `${year}-${m+1}-${d}-${hora}`;
            if(jocarsa_calendario.eventos[key]){
              const ev = jocarsa_calendario.eventos[key].texto;
              const smallp = document.createElement("div");
              smallp.textContent = `(${d}/${m+1}) ${hora}:00 - ${ev}`;
              monthDiv.appendChild(smallp);
            }
          }
        }

        yearWrapper.appendChild(monthDiv);
      }

      calendarContainer.appendChild(yearWrapper);
    }

    // Finally, default to day view on initialization
    updateCalendar();
  };

  // Expose the namespace
  global.jocarsa_calendario = jocarsa_calendario;

})(window);

