import { Component, OnInit, Input, ElementRef, ViewChildren, QueryList, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  host: {
    '(document:keydown)': 'initKeyEvent($event)'
  },
})
export class DataTableComponent implements OnInit {
  @ViewChildren('button') btnsList!: QueryList<any>
  @ViewChildren('tr') tdList!: QueryList<any>

  @Input() rows!: number
  @Input() config: any
  @Input() columns: any
  @Input() canSelect = false
  @Input() dataFunction!: Function
  @Input() multiple!: boolean

  @Output() lineSelected = new EventEmitter()

  valueClass: any
  lastPage: boolean = false
  length: number = 0
  increaseData: boolean = true
  countPage = 1
  start: number = 0
  end!: number
  arrRows = new Array(this.rows)
  isSelected: boolean = false
  selectedEl: any
  btnPresssed: boolean = false
  data = []
  prevBtn: any
  nextBtn: any
  lineInfo = {}
  tdArr: any
  rowIdArr: any = []
  allSelected = new Set<any>()

  ngOnInit(): void {
    this.arrRows = new Array(this.rows)
    this.end = this.rows
    this.fillRows()
  }

  ngAfterViewInit() {
    this.tdArr = this.tdList.toArray()
    this.fillRows()
    let btns = this.btnsList.toArray()
    this.prevBtn = btns[0].nativeElement
    this.nextBtn = btns[1].nativeElement
    this.disableBtn(this.prevBtn)
  }

  async fill(data: []) {
    this.data = data
    for (let i = 0; i < this.tdArr.length; i++) {
      let dataObj = data[i]
      let row = this.tdArr[i].nativeElement.children
      if (dataObj && this.increaseData) {
        this.length++
      }

      for (let k = 0; k < row.length; k++) {
        let td = row[k]
        if (!dataObj) {
          td.textContent = ''
          this.lastPage = true
          this.disableBtn(this.nextBtn)
          continue
        }

        this.lastPage = false
        let c = this.columns[k]
        let value
        let type = this.checkType(c.property)
        if (type == 'function') {
          value = c.property(dataObj)
        } else {
          value = dataObj[c.property]
        }

        if (c.valueClass) {
          this.addValueClass(c, td, value)
        }
        if (c.textFn) {
          value = c.textFn(value)
        }// 
        td.innerHTML = await this.formatValue(c, value)

      }
    }
  }

  fillRows() {
    let result = this.dataFunction(this.start, this.end)
    if (!(result instanceof Promise)) {
      result = Promise.resolve(result)
    }
    result.then((data: any) => {
      this.fill(data)
    })
      .then(() => {
        if (this.lastPage) {
          this.disableBtn(this.nextBtn)
        }
        if (this.countPage == 1) {
          this.disableBtn(this.prevBtn)
        }
      })
  }

  checkType<T>(v: T): string {
    return typeof v
  }

  onSelect(rowId: any) {
    let obj = this.data[rowId]
    this.rowIdArr.push(obj)
    this.lineSelected.emit(...this.rowIdArr)
  }

  addValueClass(c: any, td: any, val: string): void {
    let valueClass = c.valueClass(val)
    if (valueClass) {
      td.classList.add(valueClass)
    } else {
      td.removeAttribute('class')
      td.classList.add(c.cellClass)
    }
  }

  formatValue(c: any, val: string) {
    let res
    let route: any = {
      'percent': this.percent,
      'tax': this.tax,
      'currency': this.currency,
      'time': this.time,
      'number': this.number,
      'num': this.formatNum,
      'date': this.date,
      'int': this.int,
    }
    let allFormatFunc = Object.assign({}, route, this.config.format)

    if (allFormatFunc[c.property]) {
      let formatFunc = allFormatFunc[c.property]
      res = formatFunc(c.property)
    }

    if (c.format) {
      let [f, arg] = c.format.split(':')

      let func = allFormatFunc[f]
      res = func(val, arg)
    }

    return res || val
  }

  percent(val: number, digit: number) {
    return val.toFixed(digit) + '%'
  }

  tax(val: number, percent: string) {
    return val * Number(percent) / 100
  }

  formatNum(val: any): number {
    return parseFloat(val)
  }

  int(val: any) {
    return parseInt(val)
  }

  time(val: string) {
    // to do 
  }

  number(val: number, digit: any) {
    return val.toFixed(digit)
  }

  date(val: any, type: string) {
    let date = new Date(val)
    return type == 'short' ? date.toDateString() : date.toLocaleDateString();
  }

  async currency(val: string, type: string) {
    let res = await fetch('http://api.exchangeratesapi.io/v1/latest?access_key=11f8779054d1f07eb593dabb70c2de31')
    let data = await res.json()
    return type + (Number(val) * data.rates[type]).toFixed(2)
  }

  initKeyEvent(e: any) {
    /*   e.preventDefault()
      this.checkEventKeys(e)
      if (!this.btnPresssed) {
        return
      }
  
      let parent = this.selectedEl.parentNode
      let prevSel = this.selectedEl.previousSibling
      let nextSel = this.selectedEl.nextSibling
      switch (e.key) {
        case 'ArrowUp':
          if (prevSel != parent.firstChild) {
            this.select(prevSel, this.config.selectedRowClass)
          }
          break;
        case 'ArrowDown':
          if (nextSel) {
            this.select(nextSel, this.config.selectedRowClass)
          }
          break;
        default:
          break;
      } */
  }

  checkEventKeys(e: any) {
    switch (e.key) {
      case 'PageDown':
        this.prevPege()
        break;
      case 'PageUp':
        this.nextPage()
        break;
      case 'Home':
        this.start = 0
        this.end = this.rows
        this.countPage = 1
        this.increaseData = false
        this.disableBtn(this.prevBtn)
        this.enableBtn(this.nextBtn)
        this.data = this.dataFunction(this.start, this.end)
        this.fillRows()
        break;
      case 'End':
        this.end = this.length
        this.start = this.end - this.rows
        this.countPage = Math.ceil(this.length / this.rows)
        this.increaseData = false
        this.disableBtn(this.nextBtn)
        this.enableBtn(this.prevBtn)
        this.data = this.dataFunction(this.start, this.end)
        this.fillRows()
        break;
      default:
        break;
    }
  }

  disableBtn(b: any) {
    b.classList.add('disable')
    b.disabled = true
  }

  enableBtn(b: any) {
    b.disabled = false
    b.classList.remove('disable')
  }

  nextPage() {
    if (this.lastPage) {
      return
    }

    if (this.prevBtn.disabled) {
      this.enableBtn(this.prevBtn)
    }
    this.allSelected.clear()
    this.increaseData = true
    this.countPage++
    this.start += this.rows
    this.end += this.rows
    this.data = this.dataFunction(this.start, this.end)
    this.fillRows()
    this.onChangeState('unselect')
  }

  prevPege() {
    if (this.countPage == 1) {
      return
    }

    if (this.nextBtn.disabled) {
      this.enableBtn(this.nextBtn)
    }
    this.allSelected.clear()
    this.increaseData = false
    this.countPage--
    if (this.countPage == 1) {
      this.disableBtn(this.prevBtn)
    }
    this.start -= this.rows,
      this.end -= this.rows
    this.data = this.dataFunction(this.start, this.end)
    this.fillRows()
    this.onChangeState('unselect')
  }


  selectRow(e: any, rowId: any): void {
    if (!this.canSelect) {
      return
    }

    this.btnPresssed = true
    this.select(e.currentTarget, this.config.selectedRowClass)
    this.onSelect(rowId)
  }

  private select(target: any, className: string): void {
    if (target.classList.contains(className)) {
      this.removeFromSelected(target)
      return
    }

    this.addToSelected(target)
  }

  checkState(): any {
    if (this.allSelected.size == 0) {
      return 2
    }
    if (this.allSelected.size != 0 && this.allSelected.size != this.rows) {
      return 1
    }

    if (this.allSelected.size == this.data.length) {
      return 0
    }
  }

  onChangeState(state: string) {
    let setState = state == 'selected' ? this.addToSelected : this.removeFromSelected
    setState = setState.bind(this)
    for (let r of this.tdArr) {
      setState(r.nativeElement)
    }
  }

  removeFromSelected(el: any) {
    if (el.classList.contains(this.config.selectedRowClass)) {
      el.classList.remove(this.config.selectedRowClass)
      let tdCheckBox = el.firstElementChild
      tdCheckBox.firstElementChild.checked = false
      this.allSelected.delete(el)
    }
  }

  addToSelected(el: any) {
    let tdCheckBox = el.firstElementChild
    tdCheckBox.firstElementChild.checked = true
    el.classList.add(this.config.selectedRowClass)
    this.allSelected.add(el)
  }
}
