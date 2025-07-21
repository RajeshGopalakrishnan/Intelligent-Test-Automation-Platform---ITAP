package com.itap.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;
import java.util.List;

public class SearchPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(name = "q")
    private WebElement searchBox;

    @FindBy(css = "button[type='submit'], input[type='submit']")
    private WebElement searchButton;

    @FindBy(css = ".search-results, #search")
    private WebElement searchResults;

    @FindBy(css = ".search-filters, .filter-options")
    private WebElement filterOptions;

    @FindBy(css = ".search-suggestion, .autocomplete-suggestion")
    private List<WebElement> searchSuggestions;

    @FindBy(css = ".pagination")
    private WebElement pagination;

    @FindBy(css = ".search-result-item, .result-item")
    private List<WebElement> resultItems;

    public SearchPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void navigateToSearchPage(String url) {
        driver.get(url);
        wait.until(ExpectedConditions.elementToBeClickable(searchBox));
    }

    public void enterSearchQuery(String query) {
        wait.until(ExpectedConditions.elementToBeClickable(searchBox));
        searchBox.clear();
        searchBox.sendKeys(query);
    }

    public void clickSearchButton() {
        wait.until(ExpectedConditions.elementToBeClickable(searchButton));
        searchButton.click();
    }

    public boolean verifySearchResults() {
        wait.until(ExpectedConditions.visibilityOf(searchResults));
        return searchResults.isDisplayed() && !resultItems.isEmpty();
    }

    public void clickFilterOption(String filterName) {
        wait.until(ExpectedConditions.elementToBeClickable(filterOptions));
        driver.findElements(By.cssSelector(".filter-option"))
            .stream()
            .filter(element -> element.getText().equalsIgnoreCase(filterName))
            .findFirst()
            .ifPresent(WebElement::click);
    }

    public boolean verifySearchSuggestions() {
        wait.until(ExpectedConditions.visibilityOfAllElements(searchSuggestions));
        return !searchSuggestions.isEmpty();
    }

    public void selectSearchSuggestion(String suggestion) {
        wait.until(ExpectedConditions.visibilityOfAllElements(searchSuggestions));
        searchSuggestions.stream()
            .filter(element -> element.getText().contains(suggestion))
            .findFirst()
            .ifPresent(WebElement::click);
    }

    public void navigateToNextPage() {
        wait.until(ExpectedConditions.elementToBeClickable(pagination));
        WebElement nextButton = driver.findElement(By.cssSelector(".next-page, .next"));
        nextButton.click();
    }

    public void clickResultItem(int index) {
        wait.until(ExpectedConditions.visibilityOfAllElements(resultItems));
        if (index < resultItems.size()) {
            resultItems.get(index).click();
        }
    }

    public int getResultCount() {
        wait.until(ExpectedConditions.visibilityOfAllElements(resultItems));
        return resultItems.size();
    }
}