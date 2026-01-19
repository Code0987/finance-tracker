import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useApi } from '../hooks/useApi';
import { Category } from '../types';
import { FiEdit2, FiTrash2, FiPlus, FiTag } from 'react-icons/fi';
import Modal from '../components/Modal';

const EMOJI_OPTIONS = ['🍔', '🛒', '🛍️', '🚗', '🏠', '💡', '🎬', '🏥', '📚', '🛡️', '📈', '💰', '🏦', '↩️', '↔️', '🏧', '📅', '💳', '✈️', '📱', '💇', '🎁', '📋', '📝', '🎮', '🍕', '☕', '🏋️', '💊', '🎵'];

const Categories: React.FC = () => {
  const { categories, transactions } = useStore();
  const { createCategory, editCategory, deleteCategory } = useApi();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: '#3b82f6',
    keywords: '',
    type: 'expense' as 'expense' | 'income' | 'transfer' | 'investment',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const getCategoryStats = (categoryName: string) => {
    const categoryTxns = transactions.filter(t => t.category === categoryName);
    const totalAmount = categoryTxns.reduce((sum, t) => sum + t.amount, 0);
    return {
      transactionCount: categoryTxns.length,
      totalAmount,
    };
  };

  const groupedCategories = {
    expense: categories.filter(c => c.type === 'expense'),
    income: categories.filter(c => c.type === 'income'),
    transfer: categories.filter(c => c.type === 'transfer'),
    investment: categories.filter(c => c.type === 'investment'),
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '📝',
      color: '#3b82f6',
      keywords: '',
      type: 'expense',
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      keywords: category.keywords,
      type: category.type,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Please enter a category name');
      return;
    }

    if (editingCategory) {
      await editCategory(editingCategory.id, {
        ...formData,
        parentId: null,
      });
    } else {
      await createCategory({
        ...formData,
        parentId: null,
      });
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const stats = getCategoryStats(name);
    if (stats.transactionCount > 0) {
      if (!confirm(`This category has ${stats.transactionCount} transactions. Deleting it will leave those transactions uncategorized. Continue?`)) {
        return;
      }
    }
    await deleteCategory(id);
  };

  const CategoryCard = ({ category }: { category: Category }) => {
    const stats = getCategoryStats(category.name);
    
    return (
      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow group">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: category.color + '20' }}
          >
            {category.icon}
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{category.name}</h4>
            <p className="text-xs text-slate-500">
              {stats.transactionCount} transactions
              {stats.totalAmount > 0 && ` • ₹${(stats.totalAmount / 1000).toFixed(1)}K`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openEditModal(category)}
            className="btn-icon p-2"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(category.id, category.name)}
            className="btn-icon p-2 text-danger-500 hover:bg-danger-50"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const CategorySection = ({ title, type, items }: { title: string; type: string; items: Category[] }) => (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-medium text-slate-900">{title}</h3>
        <span className="badge badge-primary">{items.length}</span>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No categories yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
          <p className="text-sm text-slate-500">Manage transaction categories and keywords</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary gap-2">
          <FiPlus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Info Card */}
      <div className="card p-4 bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FiTag className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-primary-900">Automatic Categorization</h4>
            <p className="text-sm text-primary-700 mt-1">
              Add keywords to each category to automatically categorize transactions. 
              For example, adding "swiggy, zomato" to "Food & Dining" will auto-categorize 
              any transaction with those words in the description.
            </p>
          </div>
        </div>
      </div>

      {/* Categories by Type */}
      <div className="space-y-6">
        <CategorySection title="Expense Categories" type="expense" items={groupedCategories.expense} />
        <CategorySection title="Income Categories" type="income" items={groupedCategories.income} />
        <CategorySection title="Transfer Categories" type="transfer" items={groupedCategories.transfer} />
        <CategorySection title="Investment Categories" type="investment" items={groupedCategories.investment} />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <label className="label">Icon</label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-16 h-12 flex items-center justify-center text-2xl bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {formData.icon}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-slate-200 grid grid-cols-6 gap-1 z-50">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, icon: emoji });
                          setShowEmojiPicker(false);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 rounded-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="label">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Food & Dining"
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="select"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Keywords (comma-separated)</label>
              <textarea
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="e.g., swiggy, zomato, uber eats, restaurant, cafe"
                className="input"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">
                Transactions containing these keywords will be automatically categorized
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Categories;
