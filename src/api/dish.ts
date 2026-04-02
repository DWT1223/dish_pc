import request from "@/utils/request";

// 订单相关 API
export const getCurrentOrder = () => {
  return request({
    url: "/api/orders/current",
    method: "get",
  });
};

export const addOrderItem = (orderItem: any) => {
  return request({
    url: "/api/orders/current/items",
    method: "post",
    data: orderItem,
  });
};

export const updateOrderItem = (id: string, orderItem: any) => {
  return request({
    url: `/api/orders/current/items/${id}`,
    method: "put",
    data: orderItem,
  });
};

export const deleteOrderItem = (id: string) => {
  return request({
    url: `/api/orders/current/items/${id}`,
    method: "delete",
  });
};

export const deleteOrderItems = (ids: string[]) => {
  return request({
    url: "/api/orders/current/items/batch",
    method: "delete",
    data: ids,
  });
};

export const submitOrder = () => {
  return request({
    url: "/api/orders/current/submit",
    method: "post",
  });
};

// 菜品相关 API
export const getDishes = (category?: string, keyword?: string) => {
  return request({
    url: "/api/dishes",
    method: "get",
    params: { category, keyword },
  });
};

export const getDishById = (id: string) => {
  return request({
    url: `/api/dishes/${id}`,
    method: "get",
  });
};

export const addDish = (dish: any) => {
  return request({
    url: "/api/dishes",
    method: "post",
    data: dish,
  });
};

export const updateDish = (id: string, dish: any) => {
  return request({
    url: `/api/dishes/${id}`,
    method: "put",
    data: dish,
  });
};

export const deleteDish = (id: string) => {
  return request({
    url: `/api/dishes/${id}`,
    method: "delete",
  });
};

// 已提交订单相关 API
export const getOrderPage = (params: any) => {
  return request({
    url: "/api/orders",
    method: "get",
    params,
  });
};

export const getOrderById = (id: string) => {
  return request({
    url: `/api/orders/${id}`,
    method: "get",
  });
};

export const deleteOrders = (ids: string) => {
  return request({
    url: "/api/orders",
    method: "delete",
    params: { ids },
  });
};

export const exportOrders = (params: any) => {
  return request({
    url: "/api/orders/export",
    method: "get",
    params,
    responseType: "blob",
  });
};

export default {
  getCurrentOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  deleteOrderItems,
  submitOrder,
  getDishes,
  getDishById,
  addDish,
  updateDish,
  deleteDish,
  getOrderPage,
  getOrderById,
  deleteOrders,
  exportOrders,
};