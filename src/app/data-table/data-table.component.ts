import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  Component,
  OnInit,
  Input,
  ViewChildren,
  QueryList,
  Output,
  EventEmitter,
  TrackByFunction,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ApplicationRef,
} from '@angular/core';

@Component({
  selector: 'data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('false', style({
        opacity: 1
      })),
      state('true', style({
        opacity: 0.5
      })),
      transition('* => *', [
        animate('300ms')
      ])
    ])
  ],
  host: {
    '(document:keydown)': 'initKeyEvent($event)'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
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
  @Input() identity!: TrackByFunction<any>

  @Output() lineSelected = new EventEmitter()

  valueClass: any
  lastPage: boolean = false
  length: number = 0
  increaseData: boolean = true
  countPage = 1
  start: number = 0
  arrRows: any = []
  end!: number
  isSelected: boolean = false
  selectedEl: any
  btnPresssed: boolean = false
  data: any = []
  prevBtn: any
  nextBtn: any
  tdArr: any
  selectedRows: any = []
  allSelectedArr: any = []
  allSelected = new Set<any>()
  allFormatFunc!: any
  route: any = {
    'percent': this.percent,
    'tax': this.tax,
    'currency': this.currency,
    'time': this.time,
    'number': this.number,
    'num': this.formatNum,
    'date': this.date,
    'int': this.int,
  }
  loadingState = true


  constructor(private changeDetector: ChangeDetectorRef, private applRef: ApplicationRef) {
  }

  ngOnInit() {
    this.end = this.rows
    this.getData()
    this.allFormatFunc = { ...this.route, ...this.config.format }
    for (let col of this.columns) {
      this.initCol(col)
    }
  }

  ngAfterViewInit() {
    this.tdList.changes.subscribe(data => this.tdArr = data.toArray())
    let btns = this.btnsList.toArray()
    this.prevBtn = btns[0].nativeElement
    this.nextBtn = btns[1].nativeElement
    this.disableBtn(this.prevBtn)
  }

  getData() {
    this.loadingState = true
    this.dataFunction(this.start, this.end).then((d: any) => {
      this.loadingState = false
      setTimeout(() => {
        this.arrRows = d
        this.changeDetector.detectChanges()
      }, 300);
    })
  }

  initCol(col: any) {
    if (typeof col.property == 'function') {
      col.valueFn = col.property
    } else {
      col.valueFn = (d: any) => d[col.property]
    }

    if (this.allFormatFunc[col.format]) {
      let formatFn = this.allFormatFunc[col.format]
      col.formatFn = formatFn
    }

    if (col.format) {
      col.formatFn = (v: any) => this.formatFunc(col, v)
    } else {
      col.formatFn = (d: any) => d
    }

  }

  getCellText(data: any, col: any) {
    let value = col.valueFn(data)
    return col.formatFn(value)
  }

  onSelect(rowId: any) {
    this.selectedRows.push(rowId)
    let obj = this.arrRows[rowId]
    this.lineSelected.emit(obj)
  }

  async deleteRow() {
    let start = this.end
    let end = start + this.selectedRows.length
    let newData = await this.dataFunction(start, end)
    this.arrRows = this.arrRows.filter((x: any, i: number) => !this.allSelected.has(i))
    this.arrRows = this.arrRows.concat(newData)
    this.allSelected.clear()
    this.selectedRows = []
    this.changeDetector.detectChanges()
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

  formatFunc(c: any, val: any) {
    let [f, arg] = c.format.split(':')
    let func = this.allFormatFunc[f]
    return func(val, arg)
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

  currency(val: string, type: string) {
    /*   let res = await fetch('http://api.exchangeratesapi.io/v1/latest?access_key=11f8779054d1f07eb593dabb70c2de31')
      let data = await res.json()
      return type + (Number(val) * data.rates[type]).toFixed(2) */
    return type + val
  }

  initKeyEvent(e: any) {
    e.preventDefault()
    this.checkEventKeys(e)
    /*   if (!this.btnPresssed) {
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

  async checkEventKeys(e: any) {
    switch (e.key) {
      case 'Delete':
        this.deleteRow()
        break
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
        this.arrRows = await this.dataFunction(this.start, this.end)

        break;
      case 'End':
        this.end = this.length
        this.start = this.end - this.rows
        this.countPage = Math.ceil(this.length / this.rows)
        this.increaseData = false
        this.disableBtn(this.nextBtn)
        this.enableBtn(this.prevBtn)
        this.arrRows = this.dataFunction(this.start, this.end)

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
    this.getData()
    this.changeDetector.detectChanges()
    this.onChangeState('unselect')
  }

   prevPege() {
    if (this.countPage == 1) {
      return
    }

    this.start -= this.rows,
    this.end -= this.rows
    this.getData()
    this.onChangeState('unselect')

    if (this.nextBtn.disabled) {
      this.enableBtn(this.nextBtn)
    }
    this.allSelected.clear()
    this.increaseData = false
    this.countPage--
    if (this.countPage == 1) {
      this.disableBtn(this.prevBtn)
    }

  }


  selectRow(e: any, rowId: any): void {
    if (!this.canSelect) {
      return
    }
    this.changeDetector.reattach()
    this.btnPresssed = true
    this.select(e.currentTarget, this.config.selectedRowClass, rowId)
  }

  private select(target: any, className: string, rowId: any): void {
    if (target.classList.contains(className)) {
      this.removeFromSelected(target, rowId)
      this.selectedRows.splice(rowId, 1)
      return
    }

    if (this.multiple) {
      this.addToSelected(target, rowId)
      this.onSelect(rowId)
      return
    }

    if (this.selectedEl) {
      this.removeFromSelected(this.selectedEl, rowId)
      this.selectedRows = []
    }
    this.selectedEl = target
    this.addToSelected(target, rowId)
    this.onSelect(rowId)
  }

  checkState(): any {
    if (this.allSelected.size == 0) {
      return 2
    }
    if (this.allSelected.size != 0 && this.allSelected.size != this.rows) {
      return 1
    }

    if (this.allSelected.size == this.arrRows.length) {
      return 0
    }
  }

  onChangeState(state: string) {
    let setState = state == 'selected' ? this.addToSelected : this.removeFromSelected
    setState = setState.bind(this)
    for (let i in this.tdArr) {
      setState(this.tdArr[Number(i)].nativeElement, Number(i))
    }
  }

  removeFromSelected(el: any, i: number) {
    if (el.classList.contains(this.config.selectedRowClass)) {
      el.classList.remove(this.config.selectedRowClass)
      if (this.multiple) {
        let tdCheckBox = el.firstElementChild
        tdCheckBox.firstElementChild.checked = false
      }
      this.allSelected.delete(i)
    }
  }

  addToSelected(el: any, i: number) {
    if (this.multiple) {
      let tdCheckBox = el.firstElementChild
      tdCheckBox.firstElementChild.checked = true
    }
    el.classList.add(this.config.selectedRowClass)
    this.allSelected.add(i)
  }
}
