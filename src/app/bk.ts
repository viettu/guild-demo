// import {
//   ChangeDetectionStrategy,
//   Component,
//   ContentChildren,
//   ElementRef,
//   forwardRef,
//   Host,
//   HostListener,
//   Input,
//   OnInit,
//   Optional,
//   QueryList,
//   SkipSelf,
//   TemplateRef,
//   ViewChild
// } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgSelectOption } from '@angular/forms';
// import { flatMap, isEqual } from 'lodash';
// import { BehaviorSubject, combineLatest, merge, NEVER, Observable, ReplaySubject, Subject } from 'rxjs';
// import { Destroyable } from '../../util/destroyable.util';
// import { OverlayComponent } from '../overlay/overlay.component';
// import {
//   delay,
//   delayWhen,
//   filter,
//   map,
//   mapTo,
//   publishReplay,
//   refCount,
//   shareReplay,
//   startWith,
//   switchMap,
//   withLatestFrom
// } from 'rxjs/operators';
// import { DomEventsService } from '../../util/dom-events.service';
// import { MobiInputGroupComponent } from '../../technical/mobi-input-group/input-group.component';
// import { resolveFieldPath } from './pipes/values-2-options.pipe';

// export interface MobiDropdownItem {
//   label: string;
//   value: any;
//   /** @deprecate */
//   disabled?: boolean;
// }

// export interface MobiDropdownGroupedItem {
//   label: string;
//   items: Array<MobiDropdownItem>;
// }

// const PRINTABLE_CHARACTERS = /^[a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]*$/i;

// @Component({
//   selector: 'mobi-dropdown',
//   templateUrl: './dropdown.component.html',
//   styleUrls: ['./dropdown.component.less'],
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => DropdownComponent),
//       multi: true
//     }
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class DropdownComponent extends Destroyable implements OnInit, ControlValueAccessor {
//   private inputKeydownSource$ = new Subject<Event>();
//   private hostClickSource$ = new Subject<Event>();
//   private itemSelectedSource$ = new ReplaySubject<MobiDropdownItem>(1);
//   private isDisabledSource$ = new ReplaySubject<boolean>(1);
//   private optionsSource$ = new ReplaySubject<any>(1);
//   overlayVisibleSource$ = new ReplaySubject<boolean>(1);
//   private changeTriggerFnSource$ = new ReplaySubject<(value: any) => void>();
//   private programaticValueChange$ = new ReplaySubject<any>(1);
//   private disableByFormControlSetting$ = new ReplaySubject<boolean>(1);

//   private optionFieldSource$ = new BehaviorSubject<string>(null);
//   private isPreselectIfOnlyOneOptionSource$ = new BehaviorSubject<boolean>(false);
//   private isGroupSource$ = new BehaviorSubject<boolean>(false);
//   private lastGenerateItems: any;
//   private isOptionsSetViaAttribute = false;
//   private query = '';
//   private timeHandle = null;
//   private onTouchedFn: () => any;

//   @ViewChild('overlay') overlay: OverlayComponent;
//   @ViewChild('input') inputEle: ElementRef;
//   @ViewChild('itemsWrapper') itemsWrapper: ElementRef;

//   @ContentChildren(NgSelectOption, { descendants: true })
//   set itemsChildren(value: QueryList<NgSelectOption>) {
//     if (value.length > 0) {
//       console.warn(`setting <option> and <optgroup> inside the mobi-dropdown have been deprecated.
//       Please define the attribute [options] instead.`);
//     }
//     if (this.isOptionsSetViaAttribute) {
//       return;
//     }
//     const generatedOptions = this.getOptions(value.toArray());
//     setTimeout(() => {
//       if (!isEqual(this.lastGenerateItems, generatedOptions.items)) {
//         this.optionsSource$.next(generatedOptions.items);
//         this.lastGenerateItems = generatedOptions.items;
//       }

//       if (this.isGroup !== generatedOptions.isGroup) {
//         this.isGroup = generatedOptions.isGroup;
//       }
//     });
//   }

//   @Input() tabindex: number;
//   @Input() inputId: string;
//   @Input() scrollHeight = '400px';

//   @Input() selectedItemTemplate: TemplateRef<any>;
//   @Input() itemTemplate: TemplateRef<any>;
//   @Input() groupTemplate: TemplateRef<any>;
//   @Input('prepend-empty-option-element') prependEmptyOptionElement = true;

//   @Input('preselect-if-only-one-option')
//   set preselectIfOnlyOneOption(value: boolean) {
//     this.isPreselectIfOnlyOneOptionSource$.next(value);
//   }

//   get preselectIfOnlyOneOption(): boolean {
//     return this.isPreselectIfOnlyOneOptionSource$.value;
//   }

//   @Input('readOnly')
//   set disabled(value: boolean) {
//     this.isDisabledSource$.next(value);
//   }

//   @Input('isGroup')
//   set isGroup(value: boolean) {
//     this.isGroupSource$.next(value);
//   }

//   get isGroup(): boolean {
//     return this.isGroupSource$.value;
//   }

//   /**
//    * list of select items or group items
//    */
//   @Input('options')
//   set options(value: Array<MobiDropdownItem | MobiDropdownGroupedItem>) {
//     this.isOptionsSetViaAttribute = true;
//     this.optionsSource$.next(value || []);
//   }

//   /** @deprecated This attribute is deprecated, use values2Options pipe instead */
//   @Input('optionLabel')
//   set optionLabel(value: string) {
//     console.warn(`attribute [optionLabel] is deprecated, use values2Options pipe instead`);
//     this.optionFieldSource$.next(value);
//   }

//   /** @deprecated This attribute is deprecated, use values2OptionGroups pipe instead */
//   @Input('optgroupLabel')
//   set optgroupLabel(value: string) {
//     console.warn(`attribute [optgroupLabel] is deprecated, use values2OptionGroups pipe instead`);
//   }

//   isFocus: boolean;

//   displayItems$ = this.untilDestruction(
//     combineLatest(this.optionsSource$, this.optionFieldSource$).pipe(
//       map(values => this.buildDisplayItems(values[0], values[1]))
//     )
//   ).pipe(shareReplay());

//   isDisabled$ = this.untilDestruction(
//     combineLatest(
//       this.isDisabledSource$.pipe(startWith(undefined)),
//       this.getAutoSelectItem$.pipe(startWith(null)),
//       this.disableByFormControlSetting$.pipe(startWith(false))
//     ).pipe(
//       map(values => {
//         const disableByInputAttribute = values[0];
//         const disableByExistingFirstItem = !!values[1];
//         const disableByFormControlSetting = values[2];

//         if (disableByInputAttribute !== undefined) {
//           return disableByInputAttribute || disableByFormControlSetting;
//         }

//         return disableByExistingFirstItem || disableByFormControlSetting;
//       }),
//       shareReplay()
//     )
//   );

//   private get getAutoSelectItem$(): Observable<any> {
//     return combineLatest(
//       this.displayItems$.pipe(startWith([])),
//       this.isPreselectIfOnlyOneOptionSource$,
//       this.isGroupSource$
//     ).pipe(
//       map(values => {
//         const options = values[0];
//         const isPreselectIfOnlyOneOption = values[1];
//         const isGroup = values[2];
//         if (options.length === 1 && isPreselectIfOnlyOneOption) {
//           if (isGroup) {
//             return options[0].items && options[0].items.length === 1 ? options[0].items[0] : null;
//           } else {
//             return options[0];
//           }
//         } else {
//           return null;
//         }
//       }),
//       shareReplay()
//     );
//   }

//   private get overlayVisibility$(): Observable<boolean> {
//     return merge(
//       this.overlayVisibleSource$.pipe(
//         switchMap(isOpen =>
//           isOpen
//             ? this.globalDomEventsService.documentClick$.pipe(
//                 delay(0),
//                 mapTo(false)
//               )
//             : NEVER
//         )
//       ),
//       this.hostClickSource$.pipe(
//         delayWhen(() => this.globalDomEventsService.documentClick$),
//         withLatestFrom(this.isDisabled$),
//         filter(values => !values[1]),
//         mapTo(true)
//       )
//     );
//   }

//   private valueChangeBySelection$ = this.itemSelectedSource$.pipe(
//     map((dropDownItem: MobiDropdownItem) => (dropDownItem ? dropDownItem.value : null))
//   );
//   private value$ = merge(this.programaticValueChange$, this.valueChangeBySelection$);
//   private updateTrigger$ = merge(this.itemSelectedSource$, this.optionsSource$);

//   selectedItem$ = this.updateTrigger$.pipe(
//     switchMap(() => combineLatest(this.displayItems$, this.value$, this.isGroupSource$)),
//     map(([items, selectedValue, isGroup]) => {
//       const checkItems = !isGroup ? items : flatMap(items, 'items');
//       const foundIndex = this.findSelectItemIndexByValue(selectedValue, checkItems);
//       return foundIndex > -1 ? checkItems[foundIndex] : null;
//     }),
//     publishReplay(1),
//     refCount()
//   );

//   @HostListener('click', ['$event'])
//   onClick(event: any): void {
//     this.hostClickSource$.next(event);
//     this.focusToInput();
//   }

//   constructor(
//     private globalDomEventsService: DomEventsService,
//     @Optional()
//     @Host()
//     @SkipSelf()
//     public inputGroup: MobiInputGroupComponent
//   ) {
//     super();
//   }

//   ngOnInit(): void {
//     this.untilDestruction(
//       combineLatest(this.overlayVisibleSource$, this.selectedItem$).pipe(filter(values => values[0]))
//     ).subscribe(values => {
//       this.scrollIntoSelectedItem(values[1], this.itemsWrapper.nativeElement);
//     });

//     this.untilDestruction(this.overlayVisibility$).subscribe(shouldShow => {
//       if (shouldShow) {
//         this.showOverlay();
//       } else {
//         this.hideOverlay();
//       }
//     });

//     this.untilDestruction(this.itemSelectedSource$.pipe(withLatestFrom(this.changeTriggerFnSource$))).subscribe(
//       values => {
//         const selectedOption: any = values[0];
//         const notifyChangeFn = values[1];
//         if (notifyChangeFn) {
//           notifyChangeFn(selectedOption ? selectedOption.value : null);
//         }
//       }
//     );

//     this.untilDestruction(this.getAutoSelectItem$.pipe(filter(item => !!item))).subscribe(this.itemSelectedSource$);

//     this.untilDestruction(this.inputKeydownSource$)
//       .pipe(
//         withLatestFrom(
//           this.overlayVisibleSource$.pipe(startWith(false)),
//           this.selectedItem$.pipe(startWith(null)),
//           this.displayItems$,
//           this.isDisabled$,
//           this.isGroupSource$
//         )
//       )
//       .subscribe(results => {
//         const event: any = results[0];
//         const isOpen = results[1];
//         const value = results[2] ? results[2].value : null;
//         const items = results[3];
//         const readonly = results[4];
//         const isGroup = results[5];

//         this.handleInputKeydown(event, isOpen, value, items, readonly, isGroup, this.itemsWrapper.nativeElement);
//       });
//   }

//   writeValue(value: any): void {
//     this.programaticValueChange$.next(value);
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouchedFn = fn;
//   }

//   registerOnChange(fn: any): void {
//     this.changeTriggerFnSource$.next(fn);
//   }

//   setDisabledState(isDisabled: boolean): void {
//     this.disableByFormControlSetting$.next(isDisabled);
//   }

//   onInputBlur(event: any): void {
//     this.isFocus = false;
//     if (this.onTouchedFn) {
//       this.onTouchedFn();
//     }
//   }

//   onItemSelected(event: any, item: any): void {
//     if (!item || (item && !item.disabled)) {
//       this.itemSelectedSource$.next(item);
//     }
//     this.focusToInput();
//   }

//   onOverlayOpened(event: any): void {
//     this.overlayVisibleSource$.next(true);
//   }

//   onOverlayClosed(event: any): void {
//     this.overlayVisibleSource$.next(false);
//   }

//   onInputKeydown(event: any): void {
//     this.inputKeydownSource$.next(event);
//   }

//   private compareFnc(a: any, b: any): any {
//     return isEqual(a, b);
//   }

//   private showOverlay(): void {
//     this.overlay.open();
//   }

//   private hideOverlay(): void {
//     this.overlay.close();
//   }

//   private focusToInput(): void {
//     this.inputEle.nativeElement.focus();
//   }

//   private handleInputKeydown(
//     event: KeyboardEvent,
//     isOverlayVisible: boolean,
//     currentValue: any,
//     items: Array<any>,
//     isReadonly: boolean,
//     isGroup: boolean,
//     containerElement: HTMLElement
//   ): void {
//     if (isReadonly || !items || items.length === null) {
//       return;
//     }

//     this.clearQueryTimeout();

//     switch (event.which) {
//       case 40: {
//         if (!isOverlayVisible && event.altKey) {
//           this.showOverlay();
//         } else {
//           if (items.length > 0) {
//             const checkItems = !isGroup ? items : flatMap(items, 'items');
//             let nextItem = this.findNextItem(currentValue, checkItems);
//             if (!nextItem) {
//               nextItem = this.findPriorItem(currentValue, checkItems);
//             }
//             if (nextItem) {
//               this.itemSelectedSource$.next(nextItem);
//             }
//           }
//         }
//         event.preventDefault();
//         break;
//       }
//       case 38: {
//         if (items.length > 0) {
//           const checkItems = !isGroup ? items : flatMap(items, 'items');
//           let priorItem = this.findPriorItem(currentValue, checkItems);
//           if (!priorItem) {
//             priorItem = this.findNextItem(currentValue, checkItems);
//           }
//           if (priorItem) {
//             this.itemSelectedSource$.next(priorItem);
//           }
//         }
//         event.preventDefault();
//         break;
//       }
//       case 32: {
//         if (!isOverlayVisible) {
//           this.showOverlay();
//         } else {
//           this.hideOverlay();
//         }
//         event.preventDefault();
//         break;
//       }
//       case 13: {
//         if (isOverlayVisible) {
//           this.hideOverlay();
//         }
//         event.preventDefault();
//         break;
//       }
//       case 9:
//       case 27: {
//         if (isOverlayVisible) {
//           this.hideOverlay();
//         }
//         break;
//       }
//       default: {
//         if (PRINTABLE_CHARACTERS.test(event.key)) {
//           this.query += event.key;
//           this.timeHandle = setTimeout(() => {
//             const nextItemIndex = this.findNextItemIndexByTextContent(containerElement, this.query);
//             if (nextItemIndex !== -1) {
//               const checkItems = !isGroup ? items : flatMap(items, 'items');
//               this.itemSelectedSource$.next(checkItems[nextItemIndex]);
//             }

//             this.query = '';
//           }, 300);
//           event.preventDefault();
//         }
//         break;
//       }
//     }
//   }

//   private clearQueryTimeout(): void {
//     if (!this.timeHandle) {
//       return;
//     }
//     clearTimeout(this.timeHandle);
//     this.timeHandle = null;
//   }

//   private buildDisplayItems(
//     options: Array<any>,
//     itemLabel?: string
//   ): Array<MobiDropdownItem | MobiDropdownGroupedItem> {
//     if (!options || options.length === 0) {
//       return [];
//     }

//     if (itemLabel) {
//       return options.map(option => ({
//         label: resolveFieldPath(option, itemLabel),
//         value: option
//       }));
//     }

//     return options;
//   }

//   private findPriorItem(value: any, selectItems: Array<MobiDropdownItem>): any {
//     if (!selectItems || selectItems.length === 0) {
//       return null;
//     }
//     const currentItemIndex = this.findSelectItemIndexByValue(value, selectItems);
//     let priorIndex = currentItemIndex === -1 ? selectItems.length - 1 : currentItemIndex - 1;
//     if (priorIndex < 0) {
//       priorIndex = selectItems.length - 1;
//     }

//     if (priorIndex > -1) {
//       return selectItems[priorIndex];
//     }

//     return null;
//   }

//   private findNextItem(value: any, selectItems: Array<MobiDropdownItem>): any {
//     if (!selectItems || selectItems.length === 0) {
//       return null;
//     }
//     const currentItemIndex = this.findSelectItemIndexByValue(value, selectItems);
//     let nextIndex = currentItemIndex === -1 ? 0 : currentItemIndex + 1;
//     if (nextIndex === selectItems.length) {
//       nextIndex = 0;
//     }
//     if (nextIndex < selectItems.length) {
//       return selectItems[nextIndex];
//     }

//     return null;
//   }

//   private findNextItemIndexByTextContent(containerElement: Element, startWiths: string): number {
//     if (!startWiths || !containerElement) {
//       return -1;
//     }

//     let selectedItemIndex = -1;
//     const matchItemIndexes: Array<number> = [];
//     const allItemElements = Array.from(containerElement.querySelectorAll('ul > li.dropdown-item.item-option'));

//     for (let i = 0; i < allItemElements.length; i++) {
//       const liElement: Element = allItemElements[i];
//       if (
//         (liElement.textContent || '')
//           .trim()
//           .toLowerCase()
//           .startsWith(startWiths.toLowerCase())
//       ) {
//         matchItemIndexes.push(i);
//       }

//       if (liElement.classList.contains('item-state-highlight')) {
//         selectedItemIndex = i;
//       }
//     }

//     if (matchItemIndexes.length === 0) {
//       return -1;
//     }

//     if (matchItemIndexes.length === 1) {
//       return matchItemIndexes[0];
//     }

//     const indexOfSelectedItemInMatchItemIds = selectedItemIndex > -1 ? matchItemIndexes.indexOf(selectedItemIndex) : -1;
//     if (indexOfSelectedItemInMatchItemIds > -1 && indexOfSelectedItemInMatchItemIds + 1 < matchItemIndexes.length) {
//       return matchItemIndexes[indexOfSelectedItemInMatchItemIds + 1];
//     }

//     return matchItemIndexes[0];
//   }

//   private findSelectItemIndexByValue(value: any, selectItems: Array<MobiDropdownItem>): number {
//     return selectItems.findIndex((item: MobiDropdownItem) => this.compareValue(item.value, value));
//   }

//   private stringifyItem(item): string {
//     if (typeof item === 'string') {
//       return item;
//     }

//     if (Array.isArray(item)) {
//       return JSON.stringify(item.sort());
//     }

//     return JSON.stringify(item);
//   }

//   private compareValue(value1: any, value2: any): boolean {
//     if (isEqual(value1, value2)) {
//       return true;
//     }

//     if (typeof value1 !== typeof value2) {
//       return this.stringifyItem(value1) === this.stringifyItem(value2);
//     }

//     return false;
//   }

//   private scrollIntoSelectedItem(item: any, itemsWrapper: any): void {
//     if (item && itemsWrapper) {
//       const selectedItem = itemsWrapper.querySelector('li.dropdown-item.item-option.item-state-highlight');
//       if (selectedItem) {
//         setTimeout(() => {
//           this.scrollInView(
//             itemsWrapper,
//             itemsWrapper.querySelector('li.dropdown-item.item-option.item-state-highlight')
//           );
//         });
//       }
//     }
//   }

//   private convertHtmlOptGroupElementToOption(nativeElement: HTMLOptGroupElement): any {
//     const optGroup: any = {};
//     optGroup.label = nativeElement.label;
//     optGroup.items = [];
//     return optGroup;
//   }

//   private getOption(optionComponent: NgSelectOption): any {
//     const option: any = {};
//     const nativeElement: HTMLOptionElement = optionComponent['_element']['nativeElement'];
//     option.label = nativeElement.label || (nativeElement.textContent || '').trim();
//     option.value = nativeElement.value;

//     return option;
//   }

//   private getOptions(options: Array<NgSelectOption>): any {
//     const groups: { [index: string]: any } = {};
//     let deliveryGroupIndex = 0;

//     for (let i = 0; i < options.length; i++) {
//       const nativeElement: HTMLElement = options[i]['_element']['nativeElement'];
//       const parentElement: HTMLElement = nativeElement.parentElement;
//       const optionItem = this.getOption(options[i]);

//       if (parentElement && parentElement.tagName === 'OPTGROUP') {
//         const groupKey = parentElement.offsetTop + (<HTMLOptGroupElement>parentElement).label;
//         const groupItem = groups[groupKey];
//         if (groupItem) {
//           groupItem.items.push(optionItem);
//         } else {
//           groups[groupKey] = this.convertHtmlOptGroupElementToOption(<HTMLOptGroupElement>parentElement);
//           groups[groupKey].items.push(optionItem);
//           deliveryGroupIndex--;
//         }
//       } else {
//         const groupKey = deliveryGroupIndex + '';
//         const groupItem = groups[groupKey];
//         if (groupItem) {
//           groupItem.items.push(optionItem);
//         } else {
//           groups[groupKey] = { label: '', display: false, items: [optionItem] };
//         }
//       }
//     }

//     if (Object.keys(groups).length === 0) {
//       return [];
//     }

//     if (deliveryGroupIndex === 0) {
//       return { items: groups[0].items, isGroup: false };
//     }

//     return { items: Object.keys(groups).map(key => groups[key]), isGroup: true };
//   }

//   // copied from DomHandler because we can't seem to get DomHandler injected properly with ng 7
//   private scrollInView(container: HTMLElement, item: HTMLElement) {
//     const borderTopValue = getComputedStyle(container).getPropertyValue('borderTopWidth');
//     const borderTop = borderTopValue ? parseFloat(borderTopValue) : 0;
//     const paddingTopValue = getComputedStyle(container).getPropertyValue('paddingTop');
//     const paddingTop = paddingTopValue ? parseFloat(paddingTopValue) : 0;
//     const containerRect = container.getBoundingClientRect();
//     const itemRect = item.getBoundingClientRect();
//     const offset =
//       itemRect.top + document.body.scrollTop - (containerRect.top + document.body.scrollTop) - borderTop - paddingTop;
//     const scroll = container.scrollTop;
//     const elementHeight = container.clientHeight;
//     const itemHeight = item.offsetHeight;
//     if (offset < 0) {
//       container.scrollTop = scroll + offset;
//     } else if (offset + itemHeight > elementHeight) {
//       container.scrollTop = scroll + offset - elementHeight + itemHeight;
//     }
//   }
// }









// import { Component, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
// import { Observable, fromEvent, ReplaySubject, NEVER, merge, BehaviorSubject, combineLatest } from 'rxjs';
// import { share, switchMap, startWith, scan, mapTo, withLatestFrom, filter, shareReplay, map } from 'rxjs/operators';
// import { findIndex, isEqual, find } from 'lodash';

// export interface DropdownItem {
//   label: string;
//   value: any;
// }

// @Component({
//   selector: 'simple-dropdown',
//   templateUrl: './simple-dropdown.component.html',
//   styleUrls: ['./simple-dropdown.component.less']
// })
// export class SimpleDropdownComponent {
//   private itemsSource$ = new BehaviorSubject<Array<DropdownItem>>([]);
//   private valueSource$ = new ReplaySubject<DropdownItem>();
//   private buttonSource$ = new ReplaySubject<HTMLButtonElement>();

//   public displayItem: DropdownItem;

//   @ViewChild('toggleBtn', { read: ElementRef })
//   set toggleButton(value: ElementRef) {
//     this.buttonSource$.next(value.nativeElement);
//   }

//   /** Input items */
//   @Input()
//   set items(value: Array<DropdownItem>) {
//     this.itemsSource$.next(value);
//   }
//   get items(): Array<DropdownItem> {
//     return this.itemsSource$.value;
//   }

//   @Output() selectedItemChanged = new EventEmitter<any>();

//   overlayVisible$ = merge(
//     this.buttonClick$.pipe(mapTo('toggle')),
//     this.documentClick$.pipe(
//       withLatestFrom(this.buttonClick$),
//       filter(([documentEv, btnEv]) => documentEv !== btnEv),
//       mapTo('close')
//       )
//   ).pipe(
//     startWith(false),
//     scan((prev: boolean, curr: any) => {
//       switch (curr) {
//         case 'close':
//           return false;
//         default:
//           return !prev;
//       }
//     })
//   );

//   displayItem$ = combineLatest(this.itemsSource$, this.valueSource$).pipe(
//     map(([items, value]) => {
//       const foundItem = find(items, (item: any) => this.compareItem(item, value));
//       // console.log(foundItem);
//       return foundItem;
//     })
//   );

//   itemClick(item: DropdownItem): void {
//     this.valueSource$.next(item);
//   }

//   private get documentClick$(): Observable<Event> {
//     return fromEvent(document, 'click', { passive: false }).pipe(share());
//   }

//   private get buttonClick$(): Observable<Event> {
//     return this.buttonSource$.pipe(
//       switchMap(ele => ele ? fromEvent(ele, 'click') : NEVER)
//     );
//   }

//   private compareItem(o1: DropdownItem, o2: DropdownItem): boolean {
//     return isEqual(o1, o2);
//   }
// }
