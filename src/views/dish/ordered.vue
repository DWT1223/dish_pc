<template>
  <div class="app-container h-full flex flex-1 flex-col">
    <div class="flex-x-between mb-10">
      <el-page-header @back="$router.back()">
        <template #title>已点菜品</template>
      </el-page-header>
      <el-button type="primary" plain round size="small" @click="navigateToDishList">去点菜</el-button>
    </div>

    <!-- 已点菜品列表 -->
    <el-card v-if="orderedDishes.length > 0" shadow="hover" class="mb-10">
      <el-table :data="orderedDishes" style="width: 100%">
        <el-table-column prop="image" label="菜品图片" width="120">
          <template #default="scope">
            <el-image :src="scope.row.image" fit="cover" :preview-src-list="[scope.row.image]" style="width: 80px; height: 80px; border-radius: 8px" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="菜品名称" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="scope">
            ¥{{ scope.row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="180">
          <template #default="scope">
            <div class="quantity-control">
              <el-button size="small" @click="decreaseQuantity(scope.$index)" :disabled="scope.row.quantity <= 1">-</el-button>
              <span class="quantity">{{ scope.row.quantity }}</span>
              <el-button size="small" @click="increaseQuantity(scope.$index)">+</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="subtotal" label="小计" width="120">
          <template #default="scope">
            ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="danger" size="small" @click="removeDish(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-else description="还没有点任何菜品" class="mt-20">
      <template #description>
        <span>还没有点任何菜品</span>
      </template>
      <el-button type="primary" @click="navigateToDishList">去点菜</el-button>
    </el-empty>

    <!-- 底部结算栏 -->
    <el-card v-if="orderedDishes.length > 0" shadow="hover" class="mt-10">
      <div class="flex-x-between items-center">
        <div class="total-info">
          <span class="total-label">合计：</span>
          <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
        <el-button type="primary" size="large" @click="checkout">确认点餐</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import DishAPI from "@/api/dish";

// 加载状态
const loading = ref(false);

// 已点菜品列表
const orderedDishes = ref<any[]>([]);

// 总价
const totalPrice = computed(() => {
  return orderedDishes.value.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});

// 导航到菜品列表
const navigateToDishList = () => {
  // 假设菜品列表页面路径
  // router.push('/dish');
  ElMessage.info('导航到菜品列表');
};

// 增加数量
const increaseQuantity = async (index: number) => {
  try {
    loading.value = true;
    await DishAPI.updateOrderItem(orderedDishes.value[index].id, orderedDishes.value[index].quantity + 1);
    await loadOrderedDishes();
    ElMessage.success('更新数量成功');
  } catch (error) {
    ElMessage.error('更新数量失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 减少数量
const decreaseQuantity = async (index: number) => {
  const item = orderedDishes.value[index];
  if (item.quantity > 1) {
    try {
      loading.value = true;
      await DishAPI.updateOrderItem(item.id, item.quantity - 1);
      await loadOrderedDishes();
      ElMessage.success('更新数量成功');
    } catch (error) {
      ElMessage.error('更新数量失败，请重试');
    } finally {
      loading.value = false;
    }
  } else {
    // 如果数量为1，询问是否删除
    ElMessageBox.confirm('确定要删除这道菜吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await removeDish(index);
    });
  }
};

// 删除菜品
const removeDish = async (index: number) => {
  try {
    loading.value = true;
    await DishAPI.deleteOrderItem(orderedDishes.value[index].id);
    await loadOrderedDishes();
    ElMessage.success('删除成功');
  } catch (error) {
    ElMessage.error('删除失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 确认点餐
const checkout = async () => {
  try {
    loading.value = true;
    await DishAPI.submitOrder();
    ElMessage.success('点餐成功！');
    // 清空已点菜品
    orderedDishes.value = [];
  } catch (error) {
    ElMessage.error('提交订单失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 加载已点菜品
const loadOrderedDishes = async () => {
  try {
    loading.value = true;
    const order = await DishAPI.getCurrentOrder();
    // 转换订单菜品为已点菜品格式
    orderedDishes.value = order.items.map((item: any) => ({
      id: item.id,
      dishId: item.dishId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    }));
  } catch (error) {
    ElMessage.error('加载已点菜品失败');
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取已点菜品
onMounted(async () => {
  await loadOrderedDishes();
});
</script>

<style scoped>
.quantity-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}

.total-info {
  display: flex;
  align-items: center;
  background-color: #f0f5ff;
  padding: 10px 20px;
  border-radius: 20px;
}

.total-label {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4d4f;
  margin-left: 10px;
}
</style>