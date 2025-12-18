import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { characterService } from '../services/characterService';

const InventoryScreen = ({ route, navigation }) => {
  const { character } = route.params;
  const [characterData, setCharacterData] = useState(character);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'weapon',
    weight: '',
    quantity: '1',
    description: '',
    equipped: false,
  });

  const data = characterData.dataJson || {};
  const inventory = data.inventory || [];

  const itemTypes = [
    { key: 'weapon', label: 'Weapon', icon: '⚔️' },
    { key: 'armor', label: 'Armor', icon: '🛡️' },
    { key: 'consumable', label: 'Consumable', icon: '🧪' },
    { key: 'tool', label: 'Tool', icon: '🔧' },
    { key: 'treasure', label: 'Treasure', icon: '💎' },
    { key: 'other', label: 'Other', icon: '📦' },
  ];

  const getItemTypeIcon = (type) => {
    const itemType = itemTypes.find(t => t.key === type);
    return itemType ? itemType.icon : '📦';
  };

  const getItemTypeLabel = (type) => {
    const itemType = itemTypes.find(t => t.key === type);
    return itemType ? itemType.label : 'Other';
  };

  const calculateTotalWeight = () => {
    return inventory.reduce((total, item) => {
      const weight = parseFloat(item.weight) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (weight * quantity);
    }, 0);
  };

  const handleAddItem = async () => {
    if (!newItem.name) {
      Alert.alert('Error', 'Please fill in item name');
      return;
    }

    try {
      const itemData = {
        id: Date.now().toString(),
        name: newItem.name,
        type: newItem.type,
        weight: parseFloat(newItem.weight) || 0,
        quantity: parseInt(newItem.quantity) || 1,
        description: newItem.description,
        equipped: newItem.equipped,
      };

      const updatedInventory = [...inventory, itemData];
      const updatedData = {
        ...characterData,
        dataJson: {
          ...data,
          inventory: updatedInventory,
        },
      };

      const result = await characterService.updateCharacter(characterData.id, updatedData);
      if (result.success) {
        setCharacterData(updatedData);
        setShowAddItemModal(false);
        setNewItem({
          name: '',
          type: 'weapon',
          weight: '',
          quantity: '1',
          description: '',
          equipped: false,
        });
        Alert.alert('Success', 'Item added successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedInventory = inventory.filter(item => item.id !== itemId);
              const updatedData = {
                ...characterData,
                dataJson: {
                  ...data,
                  inventory: updatedInventory,
                },
              };

              const result = await characterService.updateCharacter(characterData.id, updatedData);
              if (result.success) {
                setCharacterData(updatedData);
                Alert.alert('Success', 'Item deleted!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleToggleEquipped = async (itemId) => {
    try {
      const updatedInventory = inventory.map(item => {
        if (item.id === itemId) {
          return { ...item, equipped: !item.equipped };
        }
        return item;
      });

      const updatedData = {
        ...characterData,
        dataJson: {
          ...data,
          inventory: updatedInventory,
        },
      };

      const result = await characterService.updateCharacter(characterData.id, updatedData);
      if (result.success) {
        setCharacterData(updatedData);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemIcon}>{getItemTypeIcon(item.type)}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemType}>{getItemTypeLabel(item.type)}</Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[
              styles.equipButton,
              item.equipped && styles.equippedButton
            ]}
            onPress={() => handleToggleEquipped(item.id)}
          >
            <Text style={styles.equipButtonText}>
              {item.equipped ? '✓' : '⚔️'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemStats}>
        <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
        <Text style={styles.itemStat}>Weight: {item.weight} lbs</Text>
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );

  const renderInventorySection = (type) => {
    const typeItems = inventory.filter(item => item.type === type);
    if (typeItems.length === 0) return null;

    return (
      <View key={type} style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getItemTypeIcon(type)} {getItemTypeLabel(type)} ({typeItems.length})
        </Text>
        {typeItems.map(item => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.weightInfo}>
            Total Weight: {calculateTotalWeight().toFixed(1)} lbs
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddItemModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inventory by Type */}
      {inventory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No items in inventory</Text>
          <Text style={styles.emptySubtext}>
            Add your first item to get started!
          </Text>
        </View>
      ) : (
        <View style={styles.inventoryContainer}>
          {itemTypes.map(type => renderInventorySection(type.key))}
        </View>
      )}

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Item Name"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            
            <View style={styles.typeSelector}>
              {itemTypes.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    newItem.type === type.key && styles.typeOptionSelected
                  ]}
                  onPress={() => setNewItem({ ...newItem, type: type.key })}
                >
                  <Text style={styles.typeOptionText}>
                    {type.icon} {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Weight (lbs)"
                value={newItem.weight}
                onChangeText={(text) => setNewItem({ ...newItem, weight: text })}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Quantity"
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                keyboardType="numeric"
              />
            </View>
            
            <TextInput
              style={[styles.modalInput, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.createButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightInfo: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  inventoryContainer: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipButton: {
    backgroundColor: '#6c757d',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  equippedButton: {
    backgroundColor: '#28a745',
  },
  equipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStat: {
    fontSize: 12,
    color: '#666',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeOptionSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#333',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default InventoryScreen;
