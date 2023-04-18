import type { ComponentFixture } from "@angular/core/testing";

import { TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";

import { ConfigFormComponent } from "./config-form.component";

describe("ConfigFormComponent", () => {
  let component: ConfigFormComponent;
  let fixture: ComponentFixture<ConfigFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigFormComponent ],
      imports: [FormsModule],
    }).compileComponents()
      .catch(e => console.log(e));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
