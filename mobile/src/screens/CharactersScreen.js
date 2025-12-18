import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { characterService } from '../services/characterService';

const CharactersScreen = ({ navigation }) => {
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    class: '',
    level: '',
    race: '',
  });

  const loadCharacters = async () => {
    try {
      const result = await characterService.getCharacters();
      if (result.success) {
        setCharacters(result.data || []);
      } else {
        console.error('Failed to load characters:', result.error);
        // Don't show alert for network errors, just log them
        if (result.error !== 'Network Error' && result.error !== 'Network Error - Please check your connection') {
          Alert.alert('Error', result.error);
        }
        // Set empty array for network errors to show empty state
        if (result.error === 'Network Error' || result.error === 'Network Error - Please check your connection') {
          setCharacters([]);
        }
      }
    } catch (error) {
      console.error('Exception in loadCharacters:', error);
      // Set empty array for exceptions to show empty state
      setCharacters([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCharacters();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCharacters();
  };

  const handleAddCharacter = async () => {
    if (!newCharacter.name) {
      Alert.alert('Error', 'Please fill in character name');
      return;
    }

    try {
      const characterData = {
        name: newCharacter.name,
        class: newCharacter.class || 'Unknown',
        level: newCharacter.level ? parseInt(newCharacter.level) : 1,
        race: newCharacter.race || 'Unknown',
        dataJson: {
          name: newCharacter.name,
          class: newCharacter.class || 'Unknown',
          level: newCharacter.level ? parseInt(newCharacter.level) : 1,
          race: newCharacter.race || 'Unknown',
          hp: 100,
          maxHp: 100,
          ac: 10,
          stats: {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
          },
        },
      };

      const result = await characterService.createCharacter(characterData);
      if (result.success) {
        setShowAddCharacterModal(false);
        setNewCharacter({
          name: '',
          class: '',
          level: '',
          race: '',
        });
        loadCharacters(); // Refresh
        Alert.alert('Success', 'Character created successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create character');
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    Alert.alert(
      'Delete Character',
      'Are you sure you want to delete this character?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await characterService.deleteCharacter(characterId);
              if (result.success) {
                loadCharacters(); // Refresh
                Alert.alert('Success', 'Character deleted!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete character');
            }
          },
        },
      ]
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) => {
      const d = c.dataJson || {};
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (d.class || '').toLowerCase().includes(q) ||
        (d.race || '').toLowerCase().includes(q)
      );
    });
  }, [characters, query]);

  const renderCharacter = (character) => {
    const data = character.dataJson || {};
    
    return (
      <View key={character.id} style={styles.characterCard}>
        <View style={styles.characterHeader}>
          <Text style={styles.characterName}>{character.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCharacter(character.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.characterInfo}>
          {data.race || 'Unknown'} {data.class || 'Unknown'} - Level {data.level || 1}
        </Text>
        
        <View style={styles.characterStats}>
          <Text style={styles.statText}>HP: {data.hp || 0}/{data.maxHp || 0}</Text>
          <Text style={styles.statText}>AC: {data.ac || 0}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardBtn, styles.primaryBtn]}
            onPress={() => navigation.navigate('CharacterDetails', { character })}
          >
            <Text style={styles.cardBtnText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardBtn, styles.secondaryBtn]}
            onPress={() => navigation.navigate('Inventory', { character })}
          >
            <Text style={styles.cardBtnText}>Inventory</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading characters...</Text>
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
        <Text style={styles.title}>My Characters</Text>
        <View style={styles.headerRight}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddCharacterModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(filtered.length === 0 && query.length > 0) ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No matches</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </View>
      ) : (characters.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No characters yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first character to get started!
          </Text>
        </View>
      ) : (
        <View style={styles.charactersList}>
          {filtered.map(renderCharacter)}
        </View>
      ))}

      {/* Add Character Modal */}
      <Modal
        visible={showAddCharacterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCharacterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Character</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Character Name"
              value={newCharacter.name}
              onChangeText={(text) => setNewCharacter({ ...newCharacter, name: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Class (optional)"
              value={newCharacter.class}
              onChangeText={(text) => setNewCharacter({ ...newCharacter, class: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Level (optional)"
              value={newCharacter.level}
              onChangeText={(text) => setNewCharacter({ ...newCharacter, level: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Race (optional)"
              value={newCharacter.race}
              onChangeText={(text) => setNewCharacter({ ...newCharacter, race: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCharacterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddCharacter}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    width: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#007bff',
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
  charactersList: {
    padding: 15,
  },
  characterCard: {
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
  characterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  characterName: {
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
  characterInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  characterStats: {
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
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryBtn: {
    backgroundColor: '#28a745',
  },
  secondaryBtn: {
    backgroundColor: '#6c757d',
  },
  cardBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#007bff',
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

export default CharactersScreen;

