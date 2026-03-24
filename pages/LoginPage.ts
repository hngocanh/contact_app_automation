import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — the root page of the app (/).
 *
 * Real HTML structure (confirmed from app source):
 *   <input id="email" type="text" />
 *   <input id="password" type="password" />
 *   <input id="submit" type="submit" value="Submit" />
 *   <a id="signup" href="/addUser">sign up</a>
 *   <span id="error">...</span>   ← only present after a failed attempt
 */
export class LoginPage extends BasePage {
  readonly emailInput:    Locator;
  readonly passwordInput: Locator;
  readonly submitButton:  Locator;
  readonly signUpLink:    Locator;
  readonly errorMessage:  Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput    = page.locator('#email1');
    this.passwordInput = page.locator('#password1');
    this.submitButton  = page.locator('#submit1');
    this.signUpLink    = page.locator('#signup');
    this.errorMessage  = page.locator('#error');
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorText(): Promise<string> {
    return this.errorMessage.innerText();
  }

  async clickSignUp(): Promise<void> {
    await this.signUpLink.click();
  }
}