import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  rows = 7
  canSelect = true

  tableColumns = [
    {
      property: 'checkbox'
    },
    {
      name: 'Име и тегло',
      property: (data: any) => data['name'] + " " + data['mass'],
      headerClass: "bold",
      cellClass: "left",
      textFn: (value: any) => value += 'kg'
    },
    {
      property: "name",
      name: "Име",
      headerClass: "bold",
      cellClass: "left",
      textFn: (value: any) => value.toUpperCase()

    },
    {
      property: "height",
      name: "Валута",
      headerClass: "bold",
      cellClass: "left",
      format: 'currency:USD',
      valueClass: (value: any) => value < 100 ? 'red' : undefined,
    },
    {
      property: "mass",
      name: "Тегло",
      headerClass: "bold",
      cellClass: "left",
      format: 'kg',
      textFn: (value: any) => value.toUpperCase()
    },
    {
      property: "created",
      name: "Създаден",
      headerClass: "bold",
      cellClass: "left",
      format: 'date:short',
    },
    {
      property: "skin_color",
      name: "Цвят на кожата",
      headerClass: "bold",
      cellClass: "left",
    
    }
   ]
  tableConfig = {
    'columns': this.tableColumns,
    'showHeader': true,
    'rows': 10,
    'format': {
      checkbox: () => `<input type = checkbox>`,
      toUperCase: (value: any) => value.toUpperCase(),
      kg: (val:any) => val + 'kg'
    },
    'canSelect': true,
    'selectedRowClass': 'selected-row',
    onselect: (data: any) => data.toUpperCase()
  }

  tableDataFunction!: Function


  constructor() {
    this.tableDataFunction = function dataFunc(pos: number, count: number) {
      return fetch('https://swapi.py4e.com/api/people')
        .then(res => res.json())
        .then(r => r.results.slice(pos, count))
    }
  }

  lineSelected(...target: any) {
    console.log('selectedRowData:', ...target)
  }

  getRowClass(line: any) {
    let status = line.status
    return status == undefined ? 'unfinished' :
      status == 0 ? 'invalid' : ''
  }
}
