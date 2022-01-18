import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';

enum States { selected, unselected, undetermined }

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css']
})
export class CheckboxComponent {
  States = States

  @Input() disabled: boolean = false
  @Input() state: States = States.undetermined

  @Output() changeState = new EventEmitter

  icons = [faCheck, faMinus, '']
  value: any
 
  ngOnChanges() {
    if (!this.disabled) {
      this.value = this.icons[this.state]
    }
  }

  ngOnInit() {
    this.value = this.icons[this.state]
  }

  onClick(): void {
    this.state++
    if (this.state > 2) {
      this.state = 0
    }
    if(this.state == 1){
      this.state++
    }
    this.changeState.emit(this.States[this.state])
    this.value = this.icons[this.state]
  }
}
