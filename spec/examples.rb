require 'rubygems'
require 'bundler/setup'
require 'rspec'
require 'capybara'
require 'capybara/rspec'
require 'capybara/poltergeist'

RSpec.configure do |config|
  config.include Capybara::DSL
end

Capybara.configure do |config|
  config.default_driver = :poltergeist
  config.run_server = false
  # config.app_host = 'http://169.254.8.103:3002'
  config.app_host = 'http://www.google.com'
end

describe "App", type: :feature do
  include Capybara::DSL

  before(:each) do
    visit('/')
  end

  describe "/", :js => true do
    puts "visiting..."
    visit '/'
    it "when clicking submit" do
      find("#current-location").click
      expect(page).to have_content "Your Closest Polling Location"
    end
  end

  describe "/mapView" do
    puts "visiting..."
    visit '/'
    it "when clicking back" do
      find("#current-location").click
      find("#change-your-address").click
      expect(page).to have_content "Voter Information"
    end
  end
end