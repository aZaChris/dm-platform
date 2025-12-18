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
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { characterService } from '../services/characterService';

const { width } = Dimensions.get('window');

const CharacterDetailsScreen = ({ route, navigation }) => {
  const { character } = route.params;
  const [characterData, setCharacterData] = useState(character);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState('');

  const data = characterData.dataJson || {};

  // D&D 5e Skills
  const skills = [
    { name: 'Acrobatics', ability: 'dex' },
    { name: 'Animal Handling', ability: 'wis' },
    { name: 'Arcana', ability: 'int' },
    { name: 'Athletics', ability: 'str' },
    { name: 'Deception', ability: 'cha' },
    { name: 'History', ability: 'int' },
    { name: 'Insight', ability: 'wis' },
    { name: 'Intimidation', ability: 'cha' },
    { name: 'Investigation', ability: 'int' },
    { name: 'Medicine', ability: 'wis' },
    { name: 'Nature', ability: 'int' },
    { name: 'Perception', ability: 'wis' },
    { name: 'Performance', ability: 'cha' },
    { name: 'Persuasion', ability: 'cha' },
    { name: 'Religion', ability: 'int' },
    { name: 'Sleight of Hand', ability: 'dex' },
    { name: 'Stealth', ability: 'dex' },
    { name: 'Survival', ability: 'wis' },
  ];

  const getAbilityModifier = (abilityScore) => {
    return Math.floor((abilityScore - 10) / 2);
  };

  const getAbilityModifierString = (abilityScore) => {
    const modifier = getAbilityModifier(abilityScore);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const getSkillModifier = (skillName) => {
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return 0;
    
    const baseModifier = getAbilityModifier(data.stats?.[skill.ability] || 10);
    const proficiencyBonus = Math.floor((data.level || 1) / 4) + 2;
    
    // TODO: Add proficiency tracking
    return baseModifier;
  };

  const handleEditField = (field, value) => {
    setEditField(field);
    setEditableData({ [field]: value });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        ...characterData,
        dataJson: {
          ...data,
          ...editableData,
        },
      };

      const result = await characterService.updateCharacter(characterData.id, updatedData);
      if (result.success) {
        setCharacterData(updatedData);
        setShowEditModal(false);
        setEditableData({});
        Alert.alert('Success', 'Character updated successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update character');
    }
  };

  const handleHPChange = (change) => {
    const newHP = Math.max(0, Math.min(data.maxHp || 100, (data.hp || 0) + change));
    const updatedData = {
      ...characterData,
      dataJson: {
        ...data,
        hp: newHP,
      },
    };
    setCharacterData(updatedData);
  };
  const handleHPDelta = (delta) => handleHPChange(delta);

  const renderStatBlock = (statName, statValue, label) => (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{statValue}</Text>
      <Text style={styles.statModifier}>
        {getAbilityModifierString(statValue)}
      </Text>
    </View>
  );

  const renderSkillRow = (skillName) => {
    const modifier = getSkillModifier(skillName);
    return (
      <View key={skillName} style={styles.skillRow}>
        <Text style={styles.skillName}>{skillName}</Text>
        <Text style={styles.skillModifier}>
          {modifier >= 0 ? `+${modifier}` : `${modifier}`}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.characterName}>{characterData.name}</Text>
        <Text style={styles.characterSubtitle}>
          Level {data.level || 1} {data.race || 'Unknown'} {data.class || 'Unknown'}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.inventoryButton}
            onPress={() => navigation.navigate('Inventory', { character: characterData })}
          >
            <Text style={styles.inventoryButtonText}>📦 Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HP and AC Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Combat</Text>
        <View style={styles.combatStats}>
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>Hit Points</Text>
            <View style={styles.hpControls}>
              <TouchableOpacity style={[styles.hpButton, styles.hpBtnMinor]} onPress={() => handleHPDelta(-5)}>
                <Text style={styles.hpButtonText}>-5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hpButton} onPress={() => handleHPDelta(-1)}>
                <Text style={styles.hpButtonText}>-1</Text>
              </TouchableOpacity>
              <Text style={styles.hpValue}>
                {data.hp || 0} / {data.maxHp || 100}
              </Text>
              <TouchableOpacity style={styles.hpButton} onPress={() => handleHPDelta(+1)}>
                <Text style={styles.hpButtonText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.hpButton, styles.hpBtnMinor]} onPress={() => handleHPDelta(+5)}>
                <Text style={styles.hpButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
            {/* Color-coded HP bar */}
            <View style={styles.hpBar}>
              <View
                style={[
                  styles.hpFill,
                  {
                    width: `${Math.max(0, Math.min(100, ((data.hp || 0) / (data.maxHp || 100)) * 100))}%`,
                    backgroundColor:
                      ((data.hp || 0) / (data.maxHp || 100)) <= 0.25
                        ? '#dc3545'
                        : ((data.hp || 0) / (data.maxHp || 100)) <= 0.5
                        ? '#ffc107'
                        : '#28a745',
                  },
                ]}
              />
            </View>
            {isEditing && (
              <TouchableOpacity
                style={styles.editFieldButton}
                onPress={() => handleEditField('maxHp', data.maxHp || 100)}
              >
                <Text style={styles.editFieldButtonText}>Edit Max HP</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.acContainer}>
            <Text style={styles.acLabel}>Armor Class</Text>
            <Text style={styles.acValue}>{data.ac || 10}</Text>
            {isEditing && (
              <TouchableOpacity
                style={styles.editFieldButton}
                onPress={() => handleEditField('ac', data.ac || 10)}
              >
                <Text style={styles.editFieldButtonText}>Edit AC</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Ability Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ability Scores</Text>
        <View style={styles.abilityScores}>
          {renderStatBlock('str', data.stats?.str || 10, 'STR')}
          {renderStatBlock('dex', data.stats?.dex || 10, 'DEX')}
          {renderStatBlock('con', data.stats?.con || 10, 'CON')}
          {renderStatBlock('int', data.stats?.int || 10, 'INT')}
          {renderStatBlock('wis', data.stats?.wis || 10, 'WIS')}
          {renderStatBlock('cha', data.stats?.cha || 10, 'CHA')}
        </View>
        {isEditing && (
          <TouchableOpacity
            style={styles.editStatsButton}
            onPress={() => Alert.alert('Info', 'Edit individual stats coming soon!')}
          >
            <Text style={styles.editStatsButtonText}>Edit All Stats</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsContainer}>
          {skills.map(renderSkillRow)}
        </View>
      </View>

      {/* Saving Throws */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saving Throws</Text>
        <View style={styles.savingThrows}>
          {Object.entries(data.stats || {}).map(([ability, score]) => (
            <View key={ability} style={styles.savingThrowRow}>
              <Text style={styles.savingThrowName}>
                {ability.toUpperCase()}
              </Text>
              <Text style={styles.savingThrowModifier}>
                {getAbilityModifierString(score)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Speed:</Text>
          <Text style={styles.infoValue}>{data.speed || '30 ft'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Initiative:</Text>
          <Text style={styles.infoValue}>
            {getAbilityModifierString(data.stats?.dex || 10)}
          </Text>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={`Enter new ${editField}`}
              value={editableData[editField]?.toString() || ''}
              onChangeText={(text) => setEditableData({ [editField]: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  characterSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  inventoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  combatStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hpContainer: {
    flex: 1,
    alignItems: 'center',
  },
  hpLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  hpControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hpBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 10,
  },
  hpFill: {
    height: '100%',
    borderRadius: 4,
  },
  hpButton: {
    backgroundColor: '#dc3545',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  hpBtnMinor: {
    backgroundColor: '#f8d7da',
  },
  hpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hpValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  acContainer: {
    flex: 1,
    alignItems: 'center',
  },
  acLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  acValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editFieldButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  editFieldButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  abilityScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBlock: {
    width: (width - 60) / 3,
    alignItems: 'center',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statModifier: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  editStatsButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  editStatsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillRow: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skillName: {
    fontSize: 14,
    color: '#333',
  },
  skillModifier: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  savingThrows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  savingThrowRow: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  savingThrowName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  savingThrowModifier: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CharacterDetailsScreen;
