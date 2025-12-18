import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { monsterService } from '../services/monsterService';

const MonstersScreen = ({ navigation }) => {
  const [monsters, setMonsters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddMonsterModal, setShowAddMonsterModal] = useState(false);
  const [newMonster, setNewMonster] = useState({
    name: '',
    type: '',
    cr: '',
    hp: '',
    ac: '',
  });

  const loadMonsters = async () => {
    try {
      const result = await monsterService.getMonsters();
      if (result.success) {
        setMonsters(result.data || []);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load monsters');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMonsters();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadMonsters();
  };

  const handleAddMonster = async () => {
    if (!newMonster.name) {
      Alert.alert('Error', 'Please fill in monster name');
      return;
    }

    try {
      const monsterData = {
        name: newMonster.name,
        type: newMonster.type || 'Unknown',
        cr: newMonster.cr || '1/4',
        hp: newMonster.hp ? parseInt(newMonster.hp) : 10,
        ac: newMonster.ac ? parseInt(newMonster.ac) : 10,
        dataJson: {
          name: newMonster.name,
          type: newMonster.type || 'Unknown',
          cr: newMonster.cr || '1/4',
          hp: newMonster.hp ? parseInt(newMonster.hp) : 10,
          maxHp: newMonster.hp ? parseInt(newMonster.hp) : 10,
          ac: newMonster.ac ? parseInt(newMonster.ac) : 10,
          speed: '30 ft',
          stats: {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
          },
          attacks: [],
          abilities: [],
        },
      };

      const result = await monsterService.createMonster(monsterData);
      if (result.success) {
        setShowAddMonsterModal(false);
        setNewMonster({
          name: '',
          type: '',
          cr: '',
          hp: '',
          ac: '',
        });
        loadMonsters(); // Refresh
        Alert.alert('Success', 'Monster created successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create monster');
    }
  };

  const handleDeleteMonster = async (monsterId) => {
    Alert.alert(
      'Delete Monster',
      'Are you sure you want to delete this monster?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await monsterService.deleteMonster(monsterId);
              if (result.success) {
                loadMonsters(); // Refresh
                Alert.alert('Success', 'Monster deleted!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete monster');
            }
          },
        },
      ]
    );
  };

  const renderMonster = (monster) => {
    const data = monster.dataJson || {};
    
    return (
      <View key={monster.id} style={styles.monsterCard}>
        <View style={styles.monsterHeader}>
          <Text style={styles.monsterName}>{monster.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMonster(monster.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.monsterInfo}>
          {data.type || 'Unknown'} - CR {data.cr || '1/4'}
        </Text>
        
        <View style={styles.monsterStats}>
          <Text style={styles.statText}>HP: {data.hp || 0}</Text>
          <Text style={styles.statText}>AC: {data.ac || 0}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            // TODO: Navigate to monster details
            Alert.alert('Info', 'Monster details screen coming soon!');
          }}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading monsters...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Monsters</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddMonsterModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {monsters.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No monsters yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first monster to get started!
          </Text>
        </View>
      ) : (
        <View style={styles.monstersList}>
          {monsters.map(renderMonster)}
        </View>
      )}

      {/* Add Monster Modal */}
      <Modal
        visible={showAddMonsterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMonsterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Monster</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Monster Name"
              value={newMonster.name}
              onChangeText={(text) => setNewMonster({ ...newMonster, name: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Type (optional)"
              value={newMonster.type}
              onChangeText={(text) => setNewMonster({ ...newMonster, type: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="CR (optional)"
              value={newMonster.cr}
              onChangeText={(text) => setNewMonster({ ...newMonster, cr: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="HP (optional)"
              value={newMonster.hp}
              onChangeText={(text) => setNewMonster({ ...newMonster, hp: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="AC (optional)"
              value={newMonster.ac}
              onChangeText={(text) => setNewMonster({ ...newMonster, ac: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMonsterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddMonster}
              >
                <Text style={styles.createButtonText}>Create</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#dc3545',
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
  monstersList: {
    padding: 15,
  },
  monsterCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  monsterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monsterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  monsterInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  monsterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: '80%',
    maxWidth: 400,
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
    backgroundColor: '#dc3545',
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

export default MonstersScreen;

