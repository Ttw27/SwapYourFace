import requests
import sys
import json
from datetime import datetime

class PartyTeesAPITester:
    def __init__(self, base_url="https://party-shirt-builder.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) <= 3:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: Non-JSON or large response")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_templates_empty(self):
        """Test getting templates (initially empty)"""
        return self.run_test("Get Templates (Empty)", "GET", "templates", 200)

    def test_seed_templates(self):
        """Test seeding default templates"""
        return self.run_test("Seed Templates", "POST", "templates/seed", 200)

    def test_get_templates_after_seed(self):
        """Test getting templates after seeding"""
        success, response = self.run_test("Get Templates (After Seed)", "GET", "templates", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} templates")
            for template in response[:2]:  # Show first 2 templates
                print(f"   - {template.get('name', 'Unknown')} ({template.get('category', 'Unknown')})")
        return success, response

    def test_get_templates_by_category(self):
        """Test filtering templates by category"""
        success1, _ = self.run_test("Get Stag Templates", "GET", "templates?category=stag", 200)
        success2, _ = self.run_test("Get Hen Templates", "GET", "templates?category=hen", 200)
        return success1 and success2

    def test_get_popular_templates(self):
        """Test filtering popular templates"""
        return self.run_test("Get Popular Templates", "GET", "templates?popular=true", 200)

    def test_get_single_template(self):
        """Test getting a single template by ID"""
        # First get templates to find an ID
        success, templates = self.test_get_templates_after_seed()
        if success and templates and len(templates) > 0:
            template_id = templates[0]['id']
            return self.run_test(f"Get Template {template_id}", "GET", f"templates/{template_id}", 200)
        else:
            print("❌ Skipped - No templates available")
            return False, {}

    def test_get_nonexistent_template(self):
        """Test getting a non-existent template"""
        return self.run_test("Get Non-existent Template", "GET", "templates/nonexistent", 404)

    def test_pricing_endpoint(self):
        """Test pricing endpoint"""
        success, response = self.run_test("Get Pricing", "GET", "pricing", 200)
        if success:
            expected_fields = ['base_price', 'back_print_price', 'currency']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
        return success, response

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        success, response = self.run_test("Get Admin Stats", "GET", "admin/stats", 200)
        if success:
            expected_fields = ['total_orders', 'pending_orders', 'total_templates', 'total_photos', 'total_revenue']
            for field in expected_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
        return success, response

    def test_create_template(self):
        """Test creating a new template"""
        template_data = {
            "name": "Test Template",
            "category": "stag",
            "body_image_url": "https://example.com/test.png",
            "is_popular": False,
            "is_new": True
        }
        return self.run_test("Create Template", "POST", "templates", 200, template_data)

    def test_orders_endpoint_empty(self):
        """Test getting orders (should be empty initially)"""
        return self.run_test("Get Orders (Empty)", "GET", "orders", 200)

    def test_create_order(self):
        """Test creating an order"""
        order_data = {
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "items": [
                {
                    "templateId": "disco",
                    "templateName": "Disco King",
                    "size": "M",
                    "quantity": 1,
                    "price": 19.99,
                    "hasBackPrint": False
                }
            ],
            "gdpr_consent": True
        }
        return self.run_test("Create Order", "POST", "orders", 200, order_data)

    def test_create_order_without_consent(self):
        """Test creating order without GDPR consent (should fail)"""
        order_data = {
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "items": [{"templateId": "disco", "size": "M", "quantity": 1, "price": 19.99}],
            "gdpr_consent": False
        }
        return self.run_test("Create Order (No Consent)", "POST", "orders", 400, order_data)

def main():
    print("🚀 Starting PartyTees API Tests")
    print("=" * 50)
    
    tester = PartyTeesAPITester()
    
    # Test sequence
    test_functions = [
        tester.test_root_endpoint,
        tester.test_get_templates_empty,
        tester.test_seed_templates,
        tester.test_get_templates_after_seed,
        tester.test_get_templates_by_category,
        tester.test_get_popular_templates,
        tester.test_get_single_template,
        tester.test_get_nonexistent_template,
        tester.test_pricing_endpoint,
        tester.test_admin_stats,
        tester.test_create_template,
        tester.test_orders_endpoint_empty,
        tester.test_create_order,
        tester.test_create_order_without_consent,
    ]
    
    # Run all tests
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} crashed: {e}")
            tester.failed_tests.append({
                'name': test_func.__name__,
                'error': f"Test crashed: {e}",
                'endpoint': 'unknown'
            })
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['name']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())