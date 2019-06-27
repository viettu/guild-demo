import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  ElementRef,
  OnInit,
  forwardRef
} from '@angular/core';
import {
  of,
  fromEvent,
  Observable,
  ReplaySubject,
  NEVER,
  merge,
  Subject,
  combineLatest
} from 'rxjs';
import {
  withLatestFrom,
  map,
  startWith,
  switchMap,
  scan,
  mapTo
} from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { Button } from 'protractor';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { find, isEqual } from 'lodash';

export interface DropdownItem {
  label: string;
  value: any;
}

export enum ClickEvent {
  TOGGLE_OUT = 'TOGGLE_OUT',
  TOGGLE_IN = 'TOGGLE_IN',
  DOCUMENT = 'DOCUMENT'
}

@Component({
  selector: "simple-dropdown",
  templateUrl: './simple-dropdown.component.html',
  styleUrls: ['./simple-dropdown.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SimpleDropdownComponent),
      multi: true
    }
  ]
})
export class SimpleDropdownComponent implements OnInit, ControlValueAccessor {
  private onChangeFn: Function;
  private itemSource$ = new BehaviorSubject<Array<DropdownItem>>([]);
  private itemValue$ = new BehaviorSubject<DropdownItem>(undefined);
  private defaultSelected$ = new BehaviorSubject<boolean>(false);
  private buttonElementRef$ = new Subject<HTMLElement>();

  @Input()
  set items(value: Array<DropdownItem>) {
    this.itemSource$.next(value || []);
  }
  get items(): Array<DropdownItem> {
    return this.itemSource$.value;
  }

  @Input()
  set defaultSelected(value: boolean) {
    this.defaultSelected$.next(!!value);
  }

  @ViewChild('toggleBtn') button: ElementRef;

  @ViewChild('toggleBtn', { read: ElementRef })
  set buttton(value: ElementRef) {
    this.buttonElementRef$.next(value ? value.nativeElement : null);
  }

  displayItem$ = combineLatest(this.itemSource$, this.itemValue$, this.defaultSelected$).pipe(
    map(([itemSources, value, defaultSelected]) => {
      if (defaultSelected && itemSources.length === 1) {
        return itemSources[0];
      }
      return find(itemSources, (itm: any) => isEqual(itm, value));
    })
  );

  toggle$ = this.buttonClick$.pipe(mapTo('TOGGLE_CLICK'));

  document$ = this.documentClick$.pipe(
    filter(event => (event.target as any).className !== 'toggle'),
    mapTo('DOCUMENT_CLICK')
  );

  visibilityPanel$ = merge(this.document$, this.toggle$).pipe(
    scan((prevState: any, currentState: any) => {
      if (currentState === 'DOCUMENT_CLICK') {
        return false;
      }
      return !prevState;
    }, false)
  );

  ngOnInit(): void {}

  /** Implement ControlValueAccessor */
  writeValue(obj: any): void {
    // set init value
    this.itemValue$.next(obj);
  }

  /** Implement ControlValueAccessor */
  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: any): void {}

  onItemClick(item: DropdownItem): void {
    this.itemValue$.next(item);

    if (this.onChangeFn) {
      this.onChangeFn(item);
    }
  }

  private get buttonClick$(): Observable<Event> {
    return this.buttonElementRef$.pipe(
      switchMap((ev: any) => (ev ? fromEvent(ev, 'click') : NEVER))
    );
  }

  private get documentClick$(): Observable<Event> {
    return fromEvent(document, 'click');
  }
}
