import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SimpleDropdownModule } from './simple-dropdown/simple-dropdown.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SimpleDropdownModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
