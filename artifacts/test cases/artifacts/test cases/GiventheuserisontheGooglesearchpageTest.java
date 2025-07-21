package com.itap.tests;

import org.testng.annotations.*;
import org.openqa.selenium.WebDriver;
import org.testng.Assert;
import com.itap.pages.SearchPage;
import com.itap.utils.TestBase;

public class GiventheuserisontheGooglesearchpageTest extends TestBase {
    private SearchPage searchPage;

    @BeforeClass
    public void setUp() {
        searchPage = new SearchPage(driver);
    }

    @Test(description = "Test case to verify: Given the user is on the Google search page")
    public void giventheuserisonthegooglesearchpageTest() {
        // Test Prerequisites
        // the user is on the Google search page

        
        // Step 1: Given the user is on the Google search page
        // TODO: Implement step - Given the user is on the Google search page
        // Expected: Prerequisite condition is met

        
        // Step 2: user enters "Cognizant" in search box
        searchPage.enterSearchQuery("your search query"); // Update with actual search query
        // Expected: Action is performed successfully

        
        // Step 3: And clicks the search button
        searchPage.clickSearchButton();
        // Expected: 

        
        // Step 4: search results should be displayed
        // TODO: Implement step - search results should be displayed
        // Expected: search results should be displayed

        
        // Step 5: And results should be relevant to the search query
        // TODO: Implement step - And results should be relevant to the search query
        // Expected: 

        
        // Step 6: Scenario 2: Advanced Search
        // TODO: Implement step - Scenario 2: Advanced Search
        // Expected: 
    }
}