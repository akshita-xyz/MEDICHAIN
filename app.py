import streamlit as st
import pandas as pd
import joblib
from datetime import date


# =========================
# PAGE CONFIGURATION
# =========================

st.set_page_config(
    page_title="Drug Supply Chain AI",
    page_icon="💊",
    layout="wide"
)


# =========================
# LOAD TRAINED MODEL
# =========================

@st.cache_resource
def load_model():
    return joblib.load("drug_demand_model.pkl")


model = load_model()


# =========================
# TITLE
# =========================

st.title("💊 Drug Supply Chain AI")
st.subheader("AI-Powered Drug Demand Forecasting & Inventory Planning")

st.markdown(
    """
    Predict future drug demand using a trained **Random Forest Regressor**
    and use the prediction to support inventory decisions.
    """
)

st.divider()


# =========================
# INPUT SECTION
# =========================

st.header("📋 Supply Chain Inputs")

col1, col2, col3 = st.columns(3)

with col1:
    medicine = st.selectbox(
        "Medicine",
        ["Amoxicillin", "Azithromycin", "Ibuprofen", "Insulin", "Paracetamol"]
    )

    location = st.selectbox(
        "Location",
        ["Amritsar", "Chandigarh", "Delhi", "Ludhiana", "Patiala"]
    )

    supplier = st.selectbox(
        "Supplier",
        ["Supplier_A", "Supplier_B", "Supplier_C"]
    )


with col2:
    inventory = st.number_input(
        "Current Inventory",
        min_value=0,
        value=300,
        step=10
    )

    delivery_time = st.number_input(
        "Delivery Time (days)",
        min_value=1,
        value=3,
        step=1
    )

    previous_demand = st.number_input(
        "Previous Demand",
        min_value=0,
        value=300,
        step=10
    )


with col3:
    prediction_date = st.date_input(
        "Prediction Date",
        value=date.today()
    )

    seven_day_average = st.number_input(
        "7-Day Average Demand",
        min_value=0.0,
        value=300.0,
        step=10.0
    )


# =========================
# DATE FEATURES
# =========================

year = prediction_date.year
month = prediction_date.month
day = prediction_date.day

# Monday = 0, Sunday = 6
day_of_week = prediction_date.weekday()

# Saturday/Sunday
is_weekend = 1 if day_of_week >= 5 else 0


st.divider()


# =========================
# PREDICTION
# =========================

if st.button("🔮 Predict Drug Demand", use_container_width=True):

    input_data = pd.DataFrame({
        "Medicine": [medicine],
        "Location": [location],
        "Supplier": [supplier],
        "Inventory": [inventory],
        "Delivery_Time": [delivery_time],
        "Year": [year],
        "Month": [month],
        "Day": [day],
        "DayOfWeek": [day_of_week],
        "IsWeekend": [is_weekend],
        "Previous_Demand": [previous_demand],
        "7_Day_Average": [seven_day_average]
    })

    prediction = model.predict(input_data)[0]

    prediction = max(0, prediction)

    st.divider()

    # =========================
    # RESULTS
    # =========================

    st.header("📊 AI Prediction")

    result_col1, result_col2, result_col3 = st.columns(3)

    with result_col1:
        st.metric(
            "Predicted Demand",
            f"{prediction:.0f} units"
        )

    with result_col2:
        st.metric(
            "Current Inventory",
            f"{inventory:.0f} units"
        )

    with result_col3:
        difference = inventory - prediction

        st.metric(
            "Inventory Balance",
            f"{difference:.0f} units"
        )


    # =========================
    # INVENTORY RECOMMENDATION
    # =========================

    st.subheader("🚦 Inventory Recommendation")

    if inventory < prediction * 0.5:

        st.error(
            f"🔴 HIGH RISK: Inventory is significantly below "
            f"predicted demand. Consider immediate restocking."
        )

    elif inventory < prediction:

        st.warning(
            f"🟡 REORDER RECOMMENDED: Current inventory may not "
            f"cover the predicted demand of {prediction:.0f} units."
        )

    else:

        st.success(
            f"🟢 INVENTORY SUFFICIENT: Current inventory should "
            f"cover the predicted demand."
        )


    # =========================
    # ADDITIONAL INFORMATION
    # =========================

    st.subheader("📦 Supply Chain Summary")

    summary = pd.DataFrame({
        "Parameter": [
            "Medicine",
            "Location",
            "Supplier",
            "Prediction Date",
            "Current Inventory",
            "Previous Demand",
            "7-Day Average",
            "Predicted Demand"
        ],
        "Value": [
            medicine,
            location,
            supplier,
            str(prediction_date),
            f"{inventory:.0f} units",
            f"{previous_demand:.0f} units",
            f"{seven_day_average:.0f} units",
            f"{prediction:.0f} units"
        ]
    })

    st.dataframe(
        summary,
        use_container_width=True,
        hide_index=True
    )


# =========================
# MODEL INFORMATION
# =========================

with st.expander("🤖 About the AI Model"):

    st.write(
        """
        This application uses a Random Forest Regressor trained on historical
        drug demand data.

        The model achieved approximately:

        • MAE: 34.16
        • RMSE: 44.24
        • R²: 0.91

        The most influential feature identified by the model was the
        7-Day Average Demand.
        """
    )