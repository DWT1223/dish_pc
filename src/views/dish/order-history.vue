<!-- 已提交订单列表 -->
<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="订单编号" prop="orderNo">
          <el-input
            v-model="queryParams.orderNo"
            placeholder="请输入订单编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="订单状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="待处理" value="PENDING" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryParams.createTime"
            :editable="false"
            type="daterange"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="截止时间"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button
            type="success"
            icon="plus"
            @click="handleCreateClick"
          >
            新增订单
          </el-button>
          <el-button
            type="danger"
            icon="delete"
            :disabled="!hasSelection"
            @click="handleDelete()"
          >
            删除
          </el-button>
        </div>
        <div class="table-section__toolbar--tools">
          <el-button icon="download" @click="exportOrders">
            导出
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="orderList"
        border
        stripe
        highlight-current-row
        class="table-section__content"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="订单编号" prop="orderNo" />
        <el-table-column label="总金额" width="120" align="center">
          <template #default="scope">
            ¥{{ scope.row.totalPrice.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜品数量" width="100" align="center" prop="itemCount" />
        <el-table-column label="创建时间" align="center" prop="createdAt" width="180" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button
              type="primary"
              icon="View"
              size="small"
              link
              @click="handleViewClick(scope.row)"
            >
              查看
            </el-button>
            <el-button
              type="danger"
              icon="delete"
              link
              size="small"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchList"
      />
    </el-card>

    <!-- 订单详情 -->
    <el-drawer
      v-model="dialogState.visible"
      :title="dialogState.title"
      append-to-body
      :size="drawerSize"
      @close="closeDialog"
    >
      <el-form ref="orderFormRef" :model="formData" label-width="80px">
        <el-form-item label="订单编号">
          <el-input v-model="formData.orderNo" readonly />
        </el-form-item>

        <el-form-item label="总金额">
          <el-input v-model="formData.totalPrice" readonly />
        </el-form-item>

        <el-form-item label="订单状态">
          <el-input v-model="getStatusText(formData.status)" readonly />
        </el-form-item>

        <el-form-item label="创建时间">
          <el-input v-model="formData.createdAt" readonly />
        </el-form-item>

        <el-form-item label="订单菜品">
          <el-table :data="formData.items" style="width: 100%">
            <el-table-column prop="name" label="菜品名称" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="scope">
                ¥{{ scope.row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="subtotal" label="小计" width="120">
              <template #default="scope">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { useAppStore } from "@/store";
import { DeviceEnum, DialogMode } from "@/enums";
import { useTableSelection } from "@/composables";
import DishAPI from "@/api/dish";

const appStore = useAppStore();

// 表单引用
const queryFormRef = ref<FormInstance>();
const orderFormRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  status: '',
  createTime: [] as string[],
});

// 列表数据
const orderList = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);

// 弹窗状态
const dialogState = reactive({
  visible: false,
  title: "订单详情",
  mode: DialogMode.VIEW,
});

// 表单数据
const formData = reactive({
  id: '',
  orderNo: '',
  totalPrice: 0,
  status: '',
  createdAt: '',
  items: [],
});

const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

const { selectedIds, hasSelection, handleSelectionChange } = useTableSelection<any>();

// 获取订单状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取订单状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '待处理';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELLED':
      return '已取消';
    default:
      return status;
  }
};

/**
 * 加载订单列表数据
 */
async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    const data = await DishAPI.getOrderPage(queryParams);
    orderList.value = data.list;
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

/**
 * 执行查询（重置页码）
 */
function handleQuery(): void {
  queryParams.pageNum = 1;
  fetchList();
}

/**
 * 重置查询条件
 */
function resetQuery(): void {
  queryFormRef.value?.resetFields();
  queryParams.createTime = [];
}

/**
 * 重置查询条件并重新查询
 */
function handleResetQuery(): void {
  resetQuery();
  handleQuery();
}

/**
 * 删除订单
 * @param orderIds 订单ID列表，多个ID用逗号分隔
 */
async function deleteOrders(orderIds: string): Promise<void> {
  await DishAPI.deleteOrders(orderIds);
  ElMessage.success("删除成功");
  handleQuery();
}

/**
 * 打开表单弹窗
 */
function openDialog(): void {
  dialogState.visible = true;
}

/**
 * 关闭表单弹窗
 */
function closeDialog(): void {
  dialogState.visible = false;
  resetForm();
}

/**
 * 重置表单数据和验证状态
 */
function resetForm(): void {
  Object.assign(formData, {
    id: '',
    orderNo: '',
    totalPrice: 0,
    status: '',
    createdAt: '',
    items: [],
  });
}

/**
 * 新增按钮点击事件
 */
async function handleCreateClick(): Promise<void> {
  // 导航到菜品列表页面
  ElMessage.info('导航到菜品列表');
}

/**
 * 查看订单详情
 * @param row 订单数据
 */
async function handleViewClick(row: any): Promise<void> {
  dialogState.title = "订单详情";
  dialogState.mode = DialogMode.VIEW;
  const data = await DishAPI.getOrderById(row.id);
  Object.assign(formData, data);
  openDialog();
}

/**
 * 删除按钮点击事件
 * @param id 订单ID，不传则删除选中的订单
 */
function handleDelete(id?: string): void {
  const orderIds = id ?? selectedIds.value.join(",");
  if (!orderIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除选中的订单吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => deleteOrders(orderIds),
    () => {
      /* 用户取消 */
    }
  );
}

/**
 * 导出订单列表
 */
async function exportOrders(): Promise<void> {
  const response = await DishAPI.exportOrders(queryParams);
  ElMessage.success("导出成功");
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.filter-section {
  margin-bottom: 20px;
}

.table-section {
  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    &--actions {
      display: flex;
      gap: 10px;
    }

    &--tools {
      display: flex;
      gap: 10px;
    }
  }

  &__content {
    margin-bottom: 20px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>