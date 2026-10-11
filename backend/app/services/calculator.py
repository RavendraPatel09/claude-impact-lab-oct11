from typing import Dict, Any, Optional
from app.schemas.answer import Citation


def calculate_front_open_space(street_width_m: float, is_existing_narrow_street: bool = False) -> Dict[str, Any]:
    """
    Calculate minimum front open space under Rule 56(1)(a) & (b) of MP Bhumi Vikas Rules, 2012.
    Applicable for residential buildings up to 12.5 meters in height.
    """
    if street_width_m <= 0:
        raise ValueError("Street width must be greater than 0 meters.")
    if street_width_m > 100:
        raise ValueError("Street width cannot exceed 100 meters.")

    if is_existing_narrow_street and street_width_m < 6.0:
        return {
            "front_open_space_m": 6.0,
            "measured_from": "center line of the street",
            "rule": "56(1)(b)",
            "clause": "Rule 56(1)(b) - In existing developed areas with streets less than 6.0 meters in width, "
                      "the distance of the building line shall be 6.0 meters from the center line of the street."
        }

    if street_width_m <= 9.0:
        front_m = 3.0
        row = "Up to 9.0 meters -> 3.0 meters"
    elif street_width_m <= 12.0:
        front_m = 3.6
        row = "More than 9.0 meters and up to 12 meters -> 3.6 meters"
    elif street_width_m <= 18.0:
        front_m = 4.5
        row = "More than 12.0 meters and up to 18 meters -> 4.5 meters"
    else:
        front_m = 6.0
        row = "Above 18 meters -> 6.0 meters"

    return {
        "front_open_space_m": front_m,
        "measured_from": "street boundary",
        "rule": "56(1)(a)",
        "clause": f"Rule 56(1)(a) Table 13: {row}."
    }


def calculate_rear_open_space(plot_area_sqm: float) -> Dict[str, Any]:
    """
    Calculate minimum rear open space under Rule 56(2)(a) Table 14 of MP Bhumi Vikas Rules, 2012.
    Applicable for residential buildings up to 12.5 meters in height.
    """
    if plot_area_sqm <= 0:
        raise ValueError("Plot area must be greater than 0 square meters.")
    if plot_area_sqm > 100000:
        raise ValueError("Plot area cannot exceed 100,000 square meters.")

    if plot_area_sqm <= 40.0:
        rear_m = 0.0
        desc = "Up to 40.00 sq m -> Nil"
    elif plot_area_sqm <= 150.0:
        rear_m = 1.50
        desc = "Above 40.00 and up to 150.00 sq m -> 1.50 meters"
    elif plot_area_sqm <= 225.0:
        rear_m = 2.50
        desc = "Above 150 and up to 225.00 sq m -> 2.50 meters"
    else:
        rear_m = 3.00
        desc = "Above 225.00 sq m -> 3.00 meters"

    return {
        "rear_open_space_m": rear_m,
        "rule": "56(2)(a)",
        "clause": f"Rule 56(2)(a) Table 14: {desc}."
    }


def calculate_residential_setbacks(
    street_width_m: float,
    plot_area_sqm: float,
    building_height_m: Optional[float] = 9.0,
    is_existing_narrow_street: bool = False
) -> Dict[str, Any]:
    """
    Full setback calculation under Rule 56 for residential buildings up to 12.5m.
    """
    if building_height_m is not None and building_height_m > 12.5:
        return {
            "status": "insufficient_evidence",
            "error": "Rule 56 applies strictly to buildings having height up to 12.5 meters. "
                     "For buildings taller than 12.5 meters, high-rise provisions under Rule 62 apply.",
            "rule": "56"
        }

    front_info = calculate_front_open_space(street_width_m, is_existing_narrow_street)
    rear_info = calculate_rear_open_space(plot_area_sqm)

    # Side open space standard for detached buildings under Rule 56(3) is 3.0m
    side_m = 3.0 if plot_area_sqm > 225.0 else 1.5

    explanation = (
        f"For a plot of {plot_area_sqm} sq. m. on a street of width {street_width_m} m "
        f"(building height <= 12.5 m): "
        f"Minimum Front Open Space = {front_info['front_open_space_m']} m ({front_info['clause']}); "
        f"Minimum Rear Open Space = {rear_info['rear_open_space_m']} m ({rear_info['clause']}); "
        f"Side Open Space = {side_m} m under Rule 56(3)."
    )

    citations = [
        Citation(
            rule="56",
            title="Residential Buildings",
            page_start=77,
            page_end=80,
            excerpt=(
                "56. Residential Buildings.-Open Spaces,- Exterior open spaces for buildings having height up to 12.5 meters. "
                "(1) Front open spaces,- (a) Every Residential Building having height up to 12.5 meters, facing street shall have a front open space... "
                "(2) Rear Open Space,- Every Residential Building, having height up to 12.5 meters, shall have a Rear Open Space..."
            )
        )
    ]

    return {
        "front_open_space_m": front_info["front_open_space_m"],
        "rear_open_space_m": rear_info["rear_open_space_m"],
        "side_open_space_m": side_m,
        "building_height_limit_m": 12.5,
        "rule": "56",
        "explanation": explanation,
        "citations": citations,
        "warnings": []
    }


def calculate_electric_clearance(line_type: str = "low_medium") -> Dict[str, Any]:
    """
    Clearance distance under Rule 52 for overhead electric supply lines.
    """
    clean_type = line_type.strip().lower()
    if "low" in clean_type or "medium" in clean_type:
        return {
            "rule": "52",
            "voltage_category": "Low and Medium voltage lines and service lines",
            "vertical_clearance_m": 2.5,
            "horizontal_clearance_m": 1.2,
            "explanation": "Rule 52(1) Table: Low and medium voltage lines require minimum 2.5 m vertical clearance and 1.2 m horizontal clearance from balconies/verandahs.",
            "citations": [
                Citation(
                    rule="52",
                    title="Distance from electric lines",
                    page_start=69,
                    page_end=70,
                    excerpt="52. Distance from electric lines.- (1) The minimum distance between the building and any overhead electric supply line shall be as mentioned herein below... Low and Medium voltage lines and service lines: Vertically 2.5 meters, Horizontally 1.2 meters."
                )
            ]
        }
    elif "high" in clean_type:
        return {
            "rule": "52",
            "voltage_category": "High voltage lines up to and including 33,000 volts",
            "vertical_clearance_m": 3.7,
            "horizontal_clearance_m": 1.2,
            "explanation": "Rule 52(1) Table: High voltage lines up to 33kV require minimum 3.7 m vertical clearance and 1.2 m horizontal clearance (2.0 m for 33kV).",
            "citations": [
                Citation(
                    rule="52",
                    title="Distance from electric lines",
                    page_start=69,
                    page_end=70,
                    excerpt="High voltage lines up to and including 33000 volts: Vertically 3.7 meters, Horizontally 1.2 meters."
                )
            ]
        }
    else:
        raise ValueError(f"Unknown electric line type: {line_type}. Use 'low_medium' or 'high'.")


def calculate_farm_house_norms() -> Dict[str, Any]:
    """
    Farm house planning parameters under Rule 17.
    """
    return {
        "rule": "17",
        "title": "Permission of farm House",
        "minimum_plot_size_hectare": 0.40,
        "minimum_plot_size_sqm": 4000.0,
        "maximum_far": 0.10,
        "maximum_height_m": 7.5,
        "roof_type": "sloping roof",
        "minimum_live_trees_per_hectare": 100,
        "minimum_road_width_m": 7.5,
        "minimum_open_space_all_sides_m": 7.50,
        "explanation": "Rule 17: In any area designated for agricultural use, Farm Houses require minimum plot size of 0.40 hectare, maximum FAR of 0.10, maximum height of 7.5 meters with sloping roof, 100 live trees/ha, minimum 7.5 m road access, and 7.5 m open space (MOS) from all sides.",
        "citations": [
            Citation(
                rule="17",
                title="Permission of farm House",
                page_start=34,
                page_end=34,
                excerpt="17. Permission of farm House.- In any area designated for agricultural use, Farm Houses shall be permissible subject to the following conditions... (a) Minimum size of the plot shall be 0.40 hectare; (b) Maximum F.A.R. shall be 0.10; (c) The maximum height of structure shall be 7.5 meters with sloping roof..."
            )
        ]
    }


def calculate_residential_building_fee(built_up_area_sqm: float) -> Dict[str, Any]:
    """
    Calculate application fee and permission fee under Rule 21 for residential building.
    """
    if built_up_area_sqm <= 0:
        raise ValueError("Built-up area must be greater than 0.")

    # Rule 21(2)(ii): Application fee = Rs 1.00 per sq. m.
    app_fee = float(built_up_area_sqm) * 1.0

    # Rule 21(3)(b) Table: Permission fee for residence (other than high rise)
    if built_up_area_sqm <= 75.0:
        perm_fee = 750.0
    elif built_up_area_sqm <= 125.0:
        perm_fee = 1250.0
    elif built_up_area_sqm <= 200.0:
        perm_fee = 2000.0
    elif built_up_area_sqm <= 300.0:
        perm_fee = 3000.0
    elif built_up_area_sqm <= 400.0:
        perm_fee = 4000.0
    elif built_up_area_sqm <= 500.0:
        perm_fee = 5000.0
    else:
        perm_fee = 5000.0 + (built_up_area_sqm - 500.0) * 10.0

    total_fee = app_fee + perm_fee

    return {
        "rule": "21",
        "built_up_area_sqm": built_up_area_sqm,
        "application_fee_rs": app_fee,
        "permission_fee_rs": perm_fee,
        "total_fee_rs": total_fee,
        "explanation": f"Under Rule 21(2)(ii), application fee is Rs 1.00/sq.m. (Rs {app_fee:.2f}). Under Rule 21(3)(b) Table, permission fee for residential built-up area of {built_up_area_sqm} sq.m. is Rs {perm_fee:.2f}. Total fee = Rs {total_fee:.2f}.",
        "citations": [
            Citation(
                rule="21",
                title="Fees",
                page_start=35,
                page_end=38,
                excerpt="21. Fees-- (2) Application Fee: (ii) for the Building Permission Rs 1.00 per Square meter of the proposed built-up area. (3) Permission Fee: (b) In case of a building permission (other than high rise buildings) A building intended to be used exclusively as residence..."
            )
        ]
    }
