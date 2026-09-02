from typing import Literal, Optional, List
from pydantic import BaseModel, Field

class Customer(BaseModel):
    name: str
    email: str
    phone: str
    type: Literal["B2B", "B2C"]

class PaymentDetails(BaseModel):
    amount: float
    currency: str = "INR"
    method: str
    bank: str
    timestamp: str
    status: str
    error_code: str

class MerchantDetails(BaseModel):
    id: str
    name: str

class Transaction(BaseModel):
    transaction_id: str
    customer: Customer
    payment: PaymentDetails
    merchant: MerchantDetails
