import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.calculator import (
    calculate_front_open_space,
    calculate_rear_open_space,
    calculate_residential_setbacks,
    calculate_electric_clearance,
    calculate_farm_house_norms,
    calculate_residential_building_fee
)


class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_front_open_space_boundaries(self):
        # Category 1: Up to 9.0 meters -> 3.0 meters
        self.assertEqual(calculate_front_open_space(6.0)["front_open_space_m"], 3.0)
        self.assertEqual(calculate_front_open_space(9.0)["front_open_space_m"], 3.0)

        # Category 2: More than 9.0m and up to 12.0m -> 3.6 meters
        self.assertEqual(calculate_front_open_space(9.1)["front_open_space_m"], 3.6)
        self.assertEqual(calculate_front_open_space(10.0)["front_open_space_m"], 3.6)
        self.assertEqual(calculate_front_open_space(12.0)["front_open_space_m"], 3.6)

        # Category 3: More than 12.0m and up to 18.0m -> 4.5 meters
        self.assertEqual(calculate_front_open_space(12.1)["front_open_space_m"], 4.5)
        self.assertEqual(calculate_front_open_space(15.0)["front_open_space_m"], 4.5)
        self.assertEqual(calculate_front_open_space(18.0)["front_open_space_m"], 4.5)

        # Category 4: Above 18 meters -> 6.0 meters
        self.assertEqual(calculate_front_open_space(18.1)["front_open_space_m"], 6.0)
        self.assertEqual(calculate_front_open_space(24.0)["front_open_space_m"], 6.0)

        # Invalid
        with self.assertRaises(ValueError):
            calculate_front_open_space(-5.0)
        with self.assertRaises(ValueError):
            calculate_front_open_space(105.0)

    def test_rear_open_space_boundaries(self):
        # Up to 40.00 -> Nil
        self.assertEqual(calculate_rear_open_space(35.0)["rear_open_space_m"], 0.0)
        self.assertEqual(calculate_rear_open_space(40.0)["rear_open_space_m"], 0.0)

        # Above 40.00 and up to 150.00 -> 1.50
        self.assertEqual(calculate_rear_open_space(40.1)["rear_open_space_m"], 1.50)
        self.assertEqual(calculate_rear_open_space(100.0)["rear_open_space_m"], 1.50)
        self.assertEqual(calculate_rear_open_space(150.0)["rear_open_space_m"], 1.50)

        # Above 150 and up to 225.00 -> 2.50
        self.assertEqual(calculate_rear_open_space(150.1)["rear_open_space_m"], 2.50)
        self.assertEqual(calculate_rear_open_space(200.0)["rear_open_space_m"], 2.50)
        self.assertEqual(calculate_rear_open_space(225.0)["rear_open_space_m"], 2.50)

        # Above 225.00 -> 3.00
        self.assertEqual(calculate_rear_open_space(225.1)["rear_open_space_m"], 3.00)
        self.assertEqual(calculate_rear_open_space(500.0)["rear_open_space_m"], 3.00)

        # Invalid
        with self.assertRaises(ValueError):
            calculate_rear_open_space(-10.0)

    def test_electric_clearance(self):
        low_med = calculate_electric_clearance("low_medium")
        self.assertEqual(low_med["vertical_clearance_m"], 2.5)
        self.assertEqual(low_med["horizontal_clearance_m"], 1.2)

        high = calculate_electric_clearance("high")
        self.assertEqual(high["vertical_clearance_m"], 3.7)

    def test_farm_house_norms(self):
        fh = calculate_farm_house_norms()
        self.assertEqual(fh["minimum_plot_size_hectare"], 0.40)
        self.assertEqual(fh["maximum_far"], 0.10)
        self.assertEqual(fh["maximum_height_m"], 7.5)

    def test_fee_calculator(self):
        fee_100 = calculate_residential_building_fee(100.0)
        self.assertEqual(fee_100["application_fee_rs"], 100.0)
        self.assertEqual(fee_100["permission_fee_rs"], 1250.0)
        self.assertEqual(fee_100["total_fee_rs"], 1350.0)

    def test_api_setback_endpoint(self):
        res = self.client.post(
            "/api/calculate/setback",
            json={
                "street_width_m": 9.0,
                "plot_area_sqm": 200.0,
                "building_height_m": 9.0
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["front_open_space_m"], 3.0)
        self.assertEqual(data["rear_open_space_m"], 2.5)
        self.assertEqual(data["rule"], "56")

    def test_api_fee_endpoint(self):
        res = self.client.get("/api/calculate/fee?built_up_area_sqm=150")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["application_fee_rs"], 150.0)
        self.assertEqual(data["permission_fee_rs"], 2000.0)


if __name__ == "__main__":
    unittest.main()
